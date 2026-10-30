import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import '../styles/voxel-coder.css';

const LAPTOP_SCREEN_JC = [
  '1110111',
  '0010100',
  '0010100',
  '1010100',
  '0100111',
];
const LAPTOP_COVER_JC = [
  '11011',
  '01010',
  '10011',
];

export default function VoxelCoder() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    /* ---------- PORTFOLIO PALETTE ---------- */
    const THEME = {
      hoodie: 0x6366f1,
      hoodieDark: 0x4338ca,
      hair: 0x111827,
      skin: 0xffdbb5,
      pants: 0x1e293b,
      shoes: 0x67e8f9,
      shoesSole: 0xf8fafc,
      laptop: 0x273249,
      laptopKeyboard: 0x080b14,
      screen: 0x111827,
      screenCodeA: 0x67e8f9,
      screenCodeB: 0xa78bfa,
      screenCodeC: 0xfbbf24,
      glasses: 0x312e81,
      accent: 0x67e8f9
    };

    const CONFIG = {
      cubeSize: 0.082,
      cubeSpacing: 0.088,
      spring: {
        stiffness: 0.088,
        damping: 0.86,
        pushRadius: 1.05,
        pushForce: 0.055,
        shatterForce: 1.85
      },
      camera: {
        fov: 38,
        pos: [3.2, 2.2, 5.2]
      }
    };

    /* ---------- GLOBAL STATE ---------- */
    let scene, camera, renderer, modelGroup;
    let animationFrameId = null;
    let canvasIsVisible = true;
    let pageIsVisible = !document.hidden;
    let physicsIsActive = true;
    let instancedMesh;
    let totalCubes = 0;

    let currentPositions, targetPositions, targetScales, velocities, colors, targetColors;
    let targetColorKeys = [];

    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2(-999, -999);
    const plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
    const mouseWorldPos = new THREE.Vector3(999, 999, 0);
    let hasMouseInteracted = false;
    let pendingPointerUpdate = false;
    let pendingClientX = 0;
    let pendingClientY = 0;
    let cachedRect = null;

    const getCanvasRect = () => {
      if (!cachedRect) {
        cachedRect = canvas.getBoundingClientRect();
      }
      return cachedRect;
    };

    const invalidateRect = () => {
      cachedRect = null;
    };

    /* ---------- INITIALIZATION ---------- */
    function init() {
      // 1. Scene
      scene = new THREE.Scene();

      // 2. Camera
      const width = canvas.clientWidth || 1;
      const height = canvas.clientHeight || 1;
      camera = new THREE.PerspectiveCamera(
        CONFIG.camera.fov,
        width / Math.max(height, 1),
        0.1,
        100
      );
      camera.position.set(...CONFIG.camera.pos);
      camera.lookAt(0, 1.45, 0);

      // 3. Renderer with transparent background and optimal DPR cap
      const compactScreen = window.matchMedia('(max-width: 680px)').matches;
      renderer = new THREE.WebGLRenderer({
        canvas,
        antialias: !compactScreen,
        alpha: true,
        powerPreference: 'high-performance',
        stencil: false,
        depth: true
      });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, compactScreen ? 1.0 : 1.5));
      renderer.setSize(width, height, false);
      renderer.toneMapping = THREE.NeutralToneMapping;
      renderer.toneMappingExposure = 1.15;

      setupLighting();

      // 7. Generate High-Density Voxel Character & Mesh
      generateVoxelPerson();
      createInstancedMesh();

      // 8. Event Listeners
      window.addEventListener('resize', onWindowResize, { passive: true });
      window.addEventListener('scroll', invalidateRect, { passive: true });
      canvas.addEventListener('pointerenter', invalidateRect, { passive: true });
      canvas.addEventListener('pointermove', onPointerMove, { passive: true });
      canvas.addEventListener('pointerleave', onPointerLeave);
      canvas.addEventListener('pointerdown', onPointerDown);
      canvas.addEventListener('keydown', onKeyDown);

      // 9. Initial Assemble Animation
      assembleFromScatter();

      // Start rendering
      startAnimation();
    }

    /* ---------- STUDIO LIGHTING ---------- */
    function setupLighting() {
      const dirLight = new THREE.DirectionalLight(0xf0fdf4, 2.5);
      dirLight.position.set(6, 9, 6);
      scene.add(dirLight);

      const rimLight = new THREE.DirectionalLight(THEME.accent, 1.3);
      rimLight.position.set(-6, -2, -5);
      scene.add(rimLight);

      const ambLight = new THREE.AmbientLight(0xffffff, 0.75);
      scene.add(ambLight);
    }

    /* ---------- VOXEL MODEL GENERATION ---------- */
    function generateVoxelPerson() {
      const coderVoxels = [];
      const s = CONFIG.cubeSpacing;

      const add = (x, y, z, colorKey, scale = 1) => {
        coderVoxels.push({ x: x * s, y: y * s, z: z * s, colorKey, scale });
      };

      // 1. SNEAKERS & SHOES (y: 0..2)
      for (const leg of [-1, 1]) {
        const xBase = leg === -1 ? -4 : 2;
        for (let dx = 0; dx < 3; dx++) {
          for (let z = -2; z <= 3; z++) {
            add(xBase + dx, 0, z, 'shoesSole');
          }
        }
        for (let dx = 0; dx < 3; dx++) {
          for (let z = -2; z <= 3; z++) {
            const isLaces = (dx === 1 && z >= 0 && z <= 2);
            add(xBase + dx, 1, z, isLaces ? 'shoesSole' : 'shoes');
            if (z <= 2) {
              add(xBase + dx, 2, z, isLaces ? 'shoesSole' : 'shoes');
            }
          }
        }
      }

      // 2. JEANS & LEGS (y: 3..11)
      for (const leg of [-1, 1]) {
        const xBase = leg === -1 ? -4 : 2;
        for (let y = 3; y <= 11; y++) {
          for (let dx = 0; dx < 3; dx++) {
            for (let z = -2; z <= 1; z++) {
              add(xBase + dx, y, z, 'pants');
            }
          }
        }
      }

      // 3. WAIST & BELT (y: 12)
      for (let x = -5; x <= 5; x++) {
        for (let z = -2; z <= 2; z++) {
          const isBuckle = (Math.abs(x) <= 1 && z === 2);
          add(x, 12, z, isBuckle ? 'accent' : 'hair');
        }
      }

      // 4. TORSO & HOODIE (y: 13..23)
      for (let y = 13; y <= 23; y++) {
        for (let x = -5; x <= 5; x++) {
          for (let z = -2; z <= 2; z++) {
            const isOuter = (Math.abs(x) === 5 || z === -2 || z === 2 || y === 13 || y === 23);
            if (isOuter) {
              const isPouch = (y >= 14 && y <= 17 && z === 2 && Math.abs(x) <= 3);
              const isString = (y >= 19 && y <= 22 && z === 2 && (x === -2 || x === 2));
              if (isString) {
                add(x, y, z + 0.4, 'shoesSole');
              } else if (isPouch) {
                add(x, y, z + 0.35, 'hoodieDark');
              } else {
                add(x, y, z, 'hoodie');
              }
            }
          }
        }
      }

      // 5. ARMS & SLEEVES (y: 15..22)
      for (let y = 18; y <= 22; y++) {
        for (let dx = 0; dx < 2; dx++) {
          for (let z = -1; z <= 1; z++) {
            add(-6 - dx, y, z, 'hoodie');
            add(6 + dx, y, z, 'hoodie');
          }
        }
      }
      for (let z = 1; z <= 4; z++) {
        for (let dx = 0; dx < 2; dx++) {
          add(-5 - dx, 15, z, 'hoodie');
          add(5 + dx, 15, z, 'hoodie');
        }
      }
      for (let dx = -1; dx <= 1; dx++) {
        for (let dz = 0; dz < 2; dz++) {
          add(-3 + dx, 15, 4 + dz, 'skin');
          add(3 + dx, 15, 4 + dz, 'skin');
        }
      }

      // 6. VOXEL LAPTOP (y: 14..21, z: 3..7)
      for (let x = -4; x <= 4; x++) {
        for (let z = 3; z <= 6; z++) {
          add(x, 14, z, 'laptop');
          if (z >= 4 && z <= 5 && Math.abs(x) <= 3) {
            const isCodeKey = (x === -2 || x === 1);
            add(x, 14.4, z, isCodeKey ? 'screenCodeA' : 'laptopKeyboard');
          } else if (z === 3 && Math.abs(x) <= 1) {
            add(x, 14.4, z, 'hair');
          }
        }
      }
      for (let x = -4; x <= 4; x++) {
        for (let y = 16; y <= 21; y++) {
          add(x, y, 6.6, 'laptop');
          if (Math.abs(x) <= 3 && y <= 20) {
            const screenRow = 20 - y;
            const screenColumn = x + 3;
            const isLogoPixel = LAPTOP_SCREEN_JC[screenRow][screenColumn] === '1';
            const codeCol = isLogoPixel ? 'screenCodeA' : 'screen';
            add(x, y, 6.2, codeCol);
          }
        }
      }

      LAPTOP_COVER_JC.forEach((row, rowIndex) => {
        [...row].forEach((pixel, columnIndex) => {
          if (pixel === '1') {
            const logoSpacing = 0.58;
            const x = (columnIndex - 2) * logoSpacing;
            const y = 18.5 + (1 - rowIndex) * logoSpacing;
            add(x, y, 7.35, 'accent', 0.55);
          }
        });
      });

      // 7. NECK & HEAD (y: 24..33)
      for (let x = -1; x <= 1; x++) {
        for (let z = -1; z <= 1; z++) {
          add(x, 24, z, 'skin');
        }
      }

      for (let y = 25; y <= 33; y++) {
        for (let x = -4; x <= 4; x++) {
          for (let z = -3; z <= 3; z++) {
            if (z === 3 && y <= 30 && Math.abs(x) <= 3) {
              if (y === 29) {
                if (Math.abs(x) === 2 || Math.abs(x) === 1 || x === 0) {
                  add(x, y, 3.4, 'glasses');
                }
                if (x === -2 || x === 2) {
                  add(x, y, 3.5, 'screenCodeA');
                } else {
                  add(x, y, 3, 'skin');
                }
              } else if (y === 28) {
                if (x === -2 || x === 2) {
                  add(x, y, 3.4, 'glasses');
                } else {
                  add(x, y, 3, 'skin');
                }
              } else {
                add(x, y, 3, 'skin');
              }
            }
            else if (y >= 31 || z <= -2 || Math.abs(x) === 4 || (y === 30 && z === 3)) {
              add(x, y, z, 'hair');
            } else {
              add(x, y, z, 'skin');
            }
          }
        }
      }

      // 8. HEADPHONES OVER EARS
      for (let x = -5; x <= 5; x++) {
        add(x, 34, 0, 'hoodie');
      }
      for (let y = 27; y <= 30; y++) {
        for (let z = -1; z <= 1; z++) {
          add(-5.5, y, z, 'accent');
          add(5.5, y, z, 'accent');
        }
      }

      totalCubes = coderVoxels.length;

      targetPositions = new Float32Array(totalCubes * 3);
      targetScales = new Float32Array(totalCubes);
      targetColorKeys = [];

      coderVoxels.forEach((v, i) => {
        targetPositions[i * 3 + 0] = v.x;
        targetPositions[i * 3 + 1] = v.y;
        targetPositions[i * 3 + 2] = v.z;
        targetScales[i] = v.scale;
        targetColorKeys.push(v.colorKey);
      });
    }

    /* ---------- INSTANCED MESH CREATION ---------- */
    function createInstancedMesh() {
      const geo = new THREE.BoxGeometry(CONFIG.cubeSize, CONFIG.cubeSize, CONFIG.cubeSize);
      const mat = new THREE.MeshStandardMaterial({
        roughness: 0.35,
        metalness: 0.15,
        flatShading: true
      });

      instancedMesh = new THREE.InstancedMesh(geo, mat, totalCubes);
      instancedMesh.castShadow = false;
      instancedMesh.receiveShadow = false;
      instancedMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);

      currentPositions = new Float32Array(totalCubes * 3);
      velocities = new Float32Array(totalCubes * 3);
      colors = new Float32Array(totalCubes * 3);
      targetColors = new Float32Array(totalCubes * 3);

      const tempColor = new THREE.Color();
      for (let i = 0; i < totalCubes; i++) {
        const key = targetColorKeys[i];
        const hex = THEME[key] || THEME.hoodie;
        tempColor.setHex(hex);

        colors[i * 3 + 0] = tempColor.r;
        colors[i * 3 + 1] = tempColor.g;
        colors[i * 3 + 2] = tempColor.b;

        targetColors[i * 3 + 0] = tempColor.r;
        targetColors[i * 3 + 1] = tempColor.g;
        targetColors[i * 3 + 2] = tempColor.b;
      }

      instancedMesh.instanceColor = new THREE.InstancedBufferAttribute(colors, 3);

      // Pre-initialize instance matrices directly into the TypedArray buffer
      // Avoids thousands of THREE.Matrix4 object allocations and trigonometric calculations per frame
      const matrixArray = instancedMesh.instanceMatrix.array;
      for (let i = 0; i < totalCubes; i++) {
        const s = targetScales[i];
        const offset = i * 16;
        matrixArray[offset + 0] = s;
        matrixArray[offset + 5] = s;
        matrixArray[offset + 10] = s;
        matrixArray[offset + 12] = targetPositions[i * 3 + 0];
        matrixArray[offset + 13] = targetPositions[i * 3 + 1];
        matrixArray[offset + 14] = targetPositions[i * 3 + 2];
        matrixArray[offset + 15] = 1;
      }
      instancedMesh.instanceMatrix.needsUpdate = true;

      modelGroup = new THREE.Group();
      modelGroup.add(instancedMesh);
      scene.add(modelGroup);
    }

    /* ---------- PHYSICS ANIMATIONS ---------- */
    function assembleFromScatter() {
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        currentPositions.set(targetPositions);
        velocities.fill(0);
        return;
      }

      const matrixArray = instancedMesh.instanceMatrix.array;
      for (let i = 0; i < totalCubes; i++) {
        const idx = i * 3;
        currentPositions[idx] = targetPositions[idx] + (Math.random() - 0.5) * 2.2;
        currentPositions[idx + 1] = targetPositions[idx + 1] + (Math.random() - 0.5) * 2.2;
        currentPositions[idx + 2] = targetPositions[idx + 2] + (Math.random() - 0.5) * 2.2;

        velocities[idx] = 0;
        velocities[idx + 1] = 0;
        velocities[idx + 2] = 0;

        const mIdx = i * 16;
        matrixArray[mIdx + 12] = currentPositions[idx];
        matrixArray[mIdx + 13] = currentPositions[idx + 1];
        matrixArray[mIdx + 14] = currentPositions[idx + 2];
      }
      instancedMesh.instanceMatrix.needsUpdate = true;
      physicsIsActive = true;
    }

    function shatterCubes() {
      physicsIsActive = true;
      const force = CONFIG.spring.shatterForce;
      for (let i = 0; i < totalCubes; i++) {
        const idx = i * 3;
        const x = currentPositions[idx];
        const y = currentPositions[idx + 1] - 1.4;
        const z = currentPositions[idx + 2];

        const len = Math.sqrt(x * x + y * y + z * z) || 1;
        const impulse = force * (0.8 + Math.random() * 1.2);

        velocities[idx]     += (x / len) * impulse + (Math.random() - 0.5) * 0.4;
        velocities[idx + 1] += (y / len) * impulse + (Math.random() - 0.2) * 0.6;
        velocities[idx + 2] += (z / len) * impulse + (Math.random() - 0.5) * 0.4;
      }
      startAnimation();
    }

    /* ---------- POINTER INTERACTIONS ---------- */
    function onPointerMove(e) {
      pendingClientX = e.clientX;
      pendingClientY = e.clientY;
      pendingPointerUpdate = true;
      physicsIsActive = true;
      hasMouseInteracted = true;
      startAnimation();
    }

    function onPointerLeave() {
      pendingPointerUpdate = false;
      hasMouseInteracted = false;
      mouseWorldPos.set(999, 999, 0);
    }

    function onPointerDown(e) {
      if (e.button === 0) shatterCubes();
    }

    function onKeyDown(e) {
      if (e.code === 'Space' || e.code === 'Enter') {
        e.preventDefault();
        shatterCubes();
      }
    }

    function onWindowResize() {
      invalidateRect();
      const width = canvas.clientWidth || 1;
      const height = canvas.clientHeight || 1;
      camera.aspect = width / Math.max(height, 1);
      camera.updateProjectionMatrix();
      renderer.setSize(width, height, false);
      const compactScreen = window.matchMedia('(max-width: 680px)').matches;
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, compactScreen ? 1.0 : 1.5));
      startAnimation();
    }

    /* ---------- RENDER LOOP ---------- */
    function startAnimation() {
      if (!animationFrameId && canvasIsVisible && pageIsVisible) {
        animationFrameId = requestAnimationFrame(animate);
      }
    }

    function stopAnimation() {
      if (animationFrameId !== null) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
      }
    }

    function animate(currentTime) {
      animationFrameId = null;
      if (!canvasIsVisible || !pageIsVisible) return;

      const time = currentTime / 1000;
      const k = CONFIG.spring.stiffness;
      const damping = CONFIG.spring.damping;
      const pushRad = CONFIG.spring.pushRadius;
      const pushForce = CONFIG.spring.pushForce;
      const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

      // Batch mouse raycasting once per frame to eliminate layout thrashing
      if (pendingPointerUpdate && !reducedMotion) {
        pendingPointerUpdate = false;
        const rect = getCanvasRect();
        if (rect.width > 0 && rect.height > 0) {
          mouse.x = ((pendingClientX - rect.left) / rect.width) * 2 - 1;
          mouse.y = -((pendingClientY - rect.top) / rect.height) * 2 + 1;
          raycaster.setFromCamera(mouse, camera);
          raycaster.ray.intersectPlane(plane, mouseWorldPos);
        }
      }

      if (modelGroup && !reducedMotion) {
        const entranceTurn = Math.max(0, 1 - time / 1.5) * Math.PI * 2;
        modelGroup.rotation.y = entranceTurn + Math.sin(time * 0.55) * 0.06;
      }

      let unsettledCubes = false;
      if (physicsIsActive) {
        const matrixArray = instancedMesh.instanceMatrix.array;
        for (let i = 0; i < totalCubes; i++) {
          const idx = i * 3;

          const cx = currentPositions[idx];
          const cy = currentPositions[idx + 1];
          const cz = currentPositions[idx + 2];

          const tx = targetPositions[idx];
          const ty = targetPositions[idx + 1];
          const tz = targetPositions[idx + 2];

          let fx = (tx - cx) * k;
          let fy = (ty - cy) * k;
          let fz = (tz - cz) * k;

          if (hasMouseInteracted && !reducedMotion) {
            const dx = cx - mouseWorldPos.x;
            const dy = cy - mouseWorldPos.y;
            const dz = cz - mouseWorldPos.z;
            const distSq = dx * dx + dy * dy + dz * dz;

            if (distSq < pushRad * pushRad && distSq > 0.001) {
              const dist = Math.sqrt(distSq);
              const repel = (1.0 - dist / pushRad) * pushForce;
              fx += (dx / dist) * repel;
              fy += (dy / dist) * repel;
              fz += (dz / dist) * repel + 0.012;
            }
          }

          velocities[idx]     = (velocities[idx] + fx) * damping;
          velocities[idx + 1] = (velocities[idx + 1] + fy) * damping;
          velocities[idx + 2] = (velocities[idx + 2] + fz) * damping;

          currentPositions[idx]     += velocities[idx];
          currentPositions[idx + 1] += velocities[idx + 1];
          currentPositions[idx + 2] += velocities[idx + 2];

          const errX = targetPositions[idx] - currentPositions[idx];
          const errY = targetPositions[idx + 1] - currentPositions[idx + 1];
          const errZ = targetPositions[idx + 2] - currentPositions[idx + 2];
          const velocitySq = velocities[idx] ** 2 + velocities[idx + 1] ** 2 + velocities[idx + 2] ** 2;
          const errorSq = errX ** 2 + errY ** 2 + errZ ** 2;
          if (errorSq < 0.000025 && velocitySq < 0.000004) {
            currentPositions[idx] = targetPositions[idx];
            currentPositions[idx + 1] = targetPositions[idx + 1];
            currentPositions[idx + 2] = targetPositions[idx + 2];
            velocities[idx] = velocities[idx + 1] = velocities[idx + 2] = 0;
          } else {
            unsettledCubes = true;
          }

          // Direct typed array write: 10x-50x faster than dummy.updateMatrix & setMatrixAt
          const mIdx = i * 16;
          matrixArray[mIdx + 12] = currentPositions[idx];
          matrixArray[mIdx + 13] = currentPositions[idx + 1];
          matrixArray[mIdx + 14] = currentPositions[idx + 2];
        }

        instancedMesh.instanceMatrix.needsUpdate = true;
        physicsIsActive = unsettledCubes;
      }

      renderer.render(scene, camera);

      if (!reducedMotion || physicsIsActive) {
        startAnimation();
      }
    }

    init();

    const resizeObserver = new ResizeObserver(() => onWindowResize());
    resizeObserver.observe(canvas);

    // Stop 3D canvas render loop when off-screen to free 100% GPU for the rest of the site
    const visibilityObserver = new IntersectionObserver(([entry]) => {
      canvasIsVisible = entry.isIntersecting;
      if (canvasIsVisible) {
        invalidateRect();
        startAnimation();
      } else {
        stopAnimation();
      }
    }, { threshold: 0 });
    visibilityObserver.observe(canvas);

    const onVisibilityChange = () => {
      pageIsVisible = !document.hidden;
      if (pageIsVisible) startAnimation();
      else stopAnimation();
    };
    document.addEventListener('visibilitychange', onVisibilityChange);

    return () => {
      stopAnimation();

      resizeObserver.disconnect();
      visibilityObserver.disconnect();
      document.removeEventListener('visibilitychange', onVisibilityChange);
      window.removeEventListener('resize', onWindowResize);
      window.removeEventListener('scroll', invalidateRect);
      canvas.removeEventListener('pointerenter', invalidateRect);
      canvas.removeEventListener('pointermove', onPointerMove);
      canvas.removeEventListener('pointerleave', onPointerLeave);
      canvas.removeEventListener('pointerdown', onPointerDown);
      canvas.removeEventListener('keydown', onKeyDown);

      if (scene) {
        scene.traverse((object) => {
          if (object.geometry) object.geometry.dispose();
          if (object.material) {
            if (Array.isArray(object.material)) {
              object.material.forEach((material) => material.dispose());
            } else {
              object.material.dispose();
            }
          }
        });
      }

      if (renderer) renderer.dispose();
    };
  }, []);

  return (
    <div className="voxel-person">
      <canvas
        ref={canvasRef}
        className="voxel-person__canvas"
        tabIndex={0}
        aria-label="Interactive 3D voxel coder at a laptop. Move the pointer over the character to move cubes, or click or press Space to scatter and reassemble them."
      />
    </div>
  );
}

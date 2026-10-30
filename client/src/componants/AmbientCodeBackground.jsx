const DETAILS = [
  { kind: 'code', value: '</>', x: '5%', duration: '37s', delay: '-13s', tint: 'cyan', size: '17px' },
  { kind: 'laptop', x: '17%', duration: '43s', delay: '-30s', tint: 'violet' },
  { kind: 'code', value: '{ }', x: '29%', duration: '40s', delay: '-4s', tint: 'violet', size: '15px' },
  { kind: 'code', value: 'const UI', x: '43%', duration: '46s', delay: '-24s', tint: 'cyan', size: '11px' },
  { kind: 'laptop', x: '58%', duration: '39s', delay: '-19s', tint: 'cyan' },
  { kind: 'code', value: 'npm run build', x: '72%', duration: '45s', delay: '-9s', tint: 'violet', size: '10px' },
  { kind: 'code', value: '01', x: '88%', duration: '36s', delay: '-28s', tint: 'cyan', size: '13px' },
  { kind: 'laptop', x: '95%', duration: '48s', delay: '-3s', tint: 'violet' },
  { kind: 'code', value: 'React()', x: '12%', duration: '42s', delay: '-36s', tint: 'violet', size: '11px' },
  { kind: 'code', value: '[ data ]', x: '36%', duration: '38s', delay: '-22s', tint: 'cyan', size: '10px' },
  { kind: 'code', value: 'API →', x: '64%', duration: '44s', delay: '-34s', tint: 'violet', size: '13px' },
  { kind: 'code', value: '0110', x: '81%', duration: '41s', delay: '-16s', tint: 'cyan', size: '10px' },
  { kind: 'window', x: '9%', duration: '46s', delay: '-39s', tint: 'violet' },
  { kind: 'code', value: '<button>', x: '24%', duration: '39s', delay: '-32s', tint: 'cyan', size: '10px' },
  { kind: 'database', x: '46%', duration: '43s', delay: '-7s', tint: 'cyan' },
  { kind: 'code', value: 'git commit', x: '55%', duration: '38s', delay: '-29s', tint: 'violet', size: '10px' },
  { kind: 'window', x: '76%', duration: '41s', delay: '-11s', tint: 'cyan' },
  { kind: 'database', x: '91%', duration: '47s', delay: '-25s', tint: 'violet' },
];

export default function AmbientCodeBackground() {
  return (
    <div className="ambient-code-background" aria-hidden="true">
      {DETAILS.map((detail, index) => (
        <span
          className={`ambient-detail ambient-detail--${detail.kind} ambient-detail--${detail.tint}`}
          key={`${detail.kind}-${index}`}
          style={{
            '--ambient-x': detail.x,
            '--ambient-duration': detail.duration,
            '--ambient-delay': detail.delay,
            '--ambient-size': detail.size ?? '1em',
          }}
        >
          {detail.kind === 'laptop' ? (
            <><span className="ambient-laptop__screen" /><span className="ambient-laptop__base" /></>
          ) : detail.kind === 'window' ? (
            <span className="ambient-window__frame"><i /><i /><i /><b /><b /><b /></span>
          ) : detail.kind === 'database' ? (
            <span className="ambient-database__stack"><i /><i /><i /></span>
          ) : detail.value}
        </span>
      ))}
    </div>
  );
}

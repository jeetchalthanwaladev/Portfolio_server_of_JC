const technologyItems = (names) => names.map((name) => ({ name, iconUrl: '' }));

const defaultPortfolioContent = {
  navigation: {
    brandName: 'JEET CHALTHANWALA',
    items: [
      { label: 'Home', href: '#home' },
      { label: 'About', href: '#about' },
      { label: 'Work', href: '#work' },
      { label: 'Stack', href: '#stack' },
    ],
    ctaLabel: "Let's talk",
    ctaHref: '#contact',
  },
  hero: {
    availability: 'AVAILABLE FOR OPPORTUNITIES',
    location: 'INDIA',
    titles: [
      'Full-Stack Developer | Building Digital Experiences',
      'Software Developer | Turning Ideas Into Reality',
      'Full-Stack Engineer | Design. Develop. Deploy.',
      'Full-Stack Developer | From Concept to Creation.',
    ],
    intro: 'Hey, I’m Jeet — a full-stack developer shaping thoughtful products for the web, from the first sketch to the final deployment.',
    primaryAction: 'Explore my work',
    secondaryAction: 'A little about me',
    chips: ['React', 'Node.js', 'Full stack'],
    artCaption: 'Move your cursor.\nScatter the code cubes.',
  },
  about: {
    kicker: '01 / A QUICK INTRO',
    heading: 'Curious by nature.',
    headingAccent: 'Developer by choice.',
    lead: 'I’m JC, a passionate full-stack developer who loves turning ideas into real-world digital solutions.',
    body: 'I build modern, responsive web applications with React, Node.js, Express, and databases. I enjoy learning new technologies, solving problems, and creating user-friendly experiences with clean, efficient code.',
    linkLabel: 'More about my approach',
    stats: [
      { value: '02+', label: 'LIVE PROJECTS' },
      { value: 'Full-stack', label: 'END-TO-END THINKING' },
      { value: '∞', label: 'ALWAYS LEARNING' },
    ],
    closing: 'Good work lives where\nclarity meets curiosity.',
  },
  projects: {
    kicker: '02 / SELECTED WORK',
    heading: 'Built to be',
    headingAccent: 'useful.',
    summary: 'Thoughtful digital experiences,\nmade for the real world.',
    items: [
      {
        id: 'mehar', number: '01', type: 'BUSINESS WEBSITE', name: 'Mehar Graphics',
        description: 'A polished digital home for a creative business, with responsive layouts and a smooth browsing experience across devices.',
        tags: ['Web Design', 'Responsive', 'Business'], url: 'https://www.mehargraphics.com/', preview: 'mehar', images: [],
      },
      {
        id: 'botein', number: '02', type: 'CORPORATE WEBSITE', name: 'Botein Pharma LLP',
        description: 'A clear, professional online presence that brings company information and pharmaceutical offerings together.',
        tags: ['Corporate', 'Content Design', 'Responsive'], url: 'https://www.boteinpharmallp.com/', preview: 'botein', images: [],
      },
    ],
  },
  skills: {
    kicker: '03 / THE TOOLKIT',
    heading: 'My stack,',
    headingAccent: 'in motion.',
    summary: 'The right tool for the right\npart of the problem.',
    featureKicker: 'CORE STRENGTH',
    featureHeading: 'From pixels\nto production.',
    featureDescription: 'I connect the details of a friendly interface with the systems that make it work — and keep learning along the way.',
    groups: [
      { title: 'Frontend', skills: technologyItems(['JavaScript', 'React', 'Next.js', 'HTML5', 'CSS3', 'Redux Toolkit']) },
      { title: 'Backend & data', skills: technologyItems(['Node.js', 'Express.js', 'REST APIs', 'MongoDB', 'MySQL', 'PostgreSQL', 'Firebase']) },
      { title: 'Languages & foundations', skills: technologyItems(['JavaScript', 'Java', 'Python', 'C', 'C++', 'Data Structures & Algorithms', 'OOP']) },
      {
        title: 'Tools, cloud & AI',
        skills: technologyItems(['Git & GitHub', 'VS Code', 'Postman', 'Docker', 'AWS', 'CI/CD', 'Figma', 'GitHub Projects', 'MongoDB Compass', 'MySQL', 'pgAdmin', 'ChatGPT', 'Gemini', 'Claude', 'GitHub Copilot', 'Cursor', 'Antigravity', 'Hugging Face', 'Google AI Studio']),
        description: 'AI-assisted coding, debugging, code optimization, documentation, and automated testing.',
      },
    ],
    softSkillsLabel: 'ALWAYS BRINGING',
    softSkills: ['Problem-solving', 'Teamwork', 'Adaptability', 'Continuous learning'],
  },
  process: {
    kicker: '04 / HOW I BUILD',
    heading: 'Good work is a',
    headingAccent: 'series of good decisions.',
    description: 'Every project is a chance to make something clearer, more useful, and a little more delightful.',
    steps: [
      { title: 'Understand', icon: '⌕', description: 'Get curious about the people, the problem, and what success should feel like.' },
      { title: 'Shape', icon: '✳', description: 'Turn the big idea into a thoughtful experience and a practical plan.' },
      { title: 'Build', icon: '</>', description: 'Write clean, reliable code and bring every detail together.' },
      { title: 'Improve', icon: '↗', description: 'Launch, learn, and keep making the experience better over time.' },
    ],
  },
  contact: {
    kicker: '05 / YOUR TURN',
    overline: 'HAVE AN IDEA IN MIND?',
    heading: 'Let’s make',
    headingAccent: 'it real.',
    email: 'jeet.chalthanwala.dev@gmail.com',
    phone: '6359347716',
    directAction: 'Email me directly',
    pitch: 'Have a project, an opportunity, or just want to say hello?\nMy inbox is always open.',
    formLabels: { name: 'Your name', email: 'Email address', message: 'Your message', submit: 'Send a message' },
    links: [
      { label: 'EMAIL', href: 'mailto:jeet.chalthanwala.dev@gmail.com' },
      { label: 'PHONE', href: 'tel:+916359347716' },
      { label: 'GITHUB', href: 'https://github.com/jeetchalthanwaladev' },
      { label: 'LINKEDIN', href: 'https://www.linkedin.com/in/jeet-chalthanwala' },
      { label: 'INSTAGRAM', href: 'https://www.instagram.com/jeet_1115_/' },
    ],
  },
  footer: {
    builtWith: 'BUILT WITH CURIOSITY',
    backToTop: 'BACK TO TOP',
  },
  seo: {
    title: 'Jeet Chalthanwala (JC) | Full-Stack Web Developer',
    description: 'Jeet Chalthanwala (JC) is a full-stack web developer in India building responsive websites and digital experiences with React, Node.js, and modern databases.',
    keywords: 'Jeet Chalthanwala, Jeet, JC, full-stack developer, web developer, React developer, Node.js developer, portfolio, Mehar Graphics, Botein Pharma LLP',
    socialImage: '',
  },
};

export default defaultPortfolioContent;

/** Public portfolio copy, grounded in the supplied master dossier and theme. */
export const profile = {
  name: "Piyush Rajput",
  headline: "Building at the intersection of AI, software, and robotics.",
  tagline: "From curiosity to creation.",
  bio: "I'm Piyush, a Computer Science and Engineering student at Karnavati University. I learn by making: 3D learning experiences, conversational AI projects, database applications, and experiments that connect software with the physical world.",
  education: {
    degree: "B.Tech (Hons.) in Computer Science and Engineering",
    institution: "Karnavati University",
    specialization: "Artificial Intelligence and Machine Learning",
    previous: "Higher secondary education in the Science stream",
  },
  interests: ["Artificial intelligence", "Generative AI", "Software engineering", "Browser-based 3D", "Robotics", "Embedded systems", "Practical technology", "Football", "Basketball"],
  links: {
    github: "https://github.com/pepieglitched",
    linkedin: "https://www.linkedin.com/in/piyush-rajput-414b21410",
  },
} as const;

export type Project = {
  slug: string;
  number: string;
  title: string;
  category: string;
  status: string;
  summary: string;
  technologies: string[];
  problem: string;
  approach: string[];
  outcome: string;
  limitations: string[];
};

export const projects: Project[] = [
  {
    slug: "tridix", number: "01", title: "Tridix", category: "3D WEB / EDUCATION", status: "Built",
    summary: "Physics, beyond the flat page. A browser-based learning experience that brings concepts into three dimensions.",
    technologies: ["HTML", "CSS", "JavaScript", "Three.js", "Blender"],
    problem: "Physics concepts can be difficult to grasp through written explanations and flat diagrams alone. Tridix was created to make them more visual for students, particularly Class 11 Science learners.",
    approach: ["Built the web experience using HTML, CSS, and JavaScript.", "Used Blender in the model workflow and Three.js to bring 3D content into the browser.", "Explored AVIF images, lazy loading, and font preloading to improve media delivery."],
    outcome: "A built 3D physics-learning website. The supplied record describes the project as previously unhosted.",
    limitations: ["A current public deployment and repository URL have not been supplied.", "The exact model inventory and interaction capabilities remain to be documented.", "Historical performance scores are omitted because their project/version attribution needs verification."],
  },
  {
    slug: "legalone", number: "02", title: "LegalOne", category: "CONVERSATIONAL AI / LEGALTECH", status: "Hackathon project",
    summary: "A conversational starting point for Indian legal information, explored with team Binary Bandits.",
    technologies: ["Botpress AI", "Conversational AI"],
    problem: "Legal terminology and complex resources can make it difficult to begin finding information about Indian laws. LegalOne explores a more approachable conversational entry point.",
    approach: ["Worked with team Binary Bandits on the OlympAI project.", "Used Botpress AI to develop the chatbot experience around Indian legal information.", "Explored applying conversational AI to a focused information domain."],
    outcome: "Team Binary Bandits cleared Stage 2 of OlympAI.",
    limitations: ["The precise prototype scope, individual role, and public deployment are not documented in the supplied record.", "This is a legal-information chatbot concept; no legal accuracy guarantee or professional endorsement is claimed."],
  },
  {
    slug: "meghdoot-ai", number: "03", title: "Meghdoot AI", category: "FLOOD DETECTION / SOCIAL IMPACT", status: "SIH team project",
    summary: "A flood-detection project explored across an app, web application, and website for Smart India Hackathon.",
    technologies: ["App", "Web application", "Website"],
    problem: "Flood-related challenges motivated a team project exploring how digital technology could support detection and disaster-related work.",
    approach: ["Participated in Smart India Hackathon during the first year of B.Tech.", "Worked with the SIH team on Meghdoot AI, described across an app, web application, and website.", "Presented the project through the college-level selection process."],
    outcome: "Qualified through the college-level round and was among the top 90 teams.",
    limitations: ["The detection method, model, data sources, technical stack, and individual responsibilities have not been supplied.", "College-level qualification is the documented result; no national finalist or winner status is claimed."],
  },
  {
    slug: "brts", number: "04", title: "BRTS Bus Route System", category: "PYTHON / DATABASE APPLICATION", status: "Terminal prototype",
    summary: "From command line to interface: working with bus-route information using Python and MySQL.",
    technologies: ["Python", "MySQL", "Tkinter"],
    problem: "This application explores how bus-route information can be handled through a database-backed Python workflow.",
    approach: ["Developed a terminal-based prototype using Python and MySQL.", "Later worked on a Tkinter graphical interface.", "Explored the transition from a command-line workflow toward a desktop application."],
    outcome: "A terminal prototype and subsequent GUI development work.",
    limitations: ["The exact implemented route features and database schema are not supplied.", "A completed, database-connected Tkinter interface is not confirmed."],
  },
  {
    slug: "smart-calendar", number: "05", title: "Smart Calendar", category: "ESP32 / INTERNET OF THINGS", status: "Exploring",
    summary: "A physical student calendar concept: dates, tasks, reminders, and a little more connection to everyday life.",
    technologies: ["ESP32 / ESP32-S3", "WS2812B LEDs", "20×4 LCD", "DS3231 RTC"],
    problem: "The concept explores making a physical calendar more useful for students by bringing date indicators, tasks, and reminders into one device.",
    approach: ["Explored an ESP32-based controller with programmable LED calendar indicators.", "Considered an LCD task display, RTC timekeeping, reminder controls, and Wi-Fi connectivity.", "Experimented with circuit configuration, output control, display integration, and power requirements."],
    outcome: "Hardware and circuit exploration in development; a completed working prototype is not confirmed.",
    limitations: ["Component integration and working features require prototype evidence.", "Google Classroom integration remains a planned feature, not a completed implementation."],
  },
  {
    slug: "autonomous-robot", number: "06", title: "Autonomous Driving Robot", category: "ROBOTICS / SYSTEM ARCHITECTURE", status: "Architecture exploration",
    summary: "Exploring the bridge from perception to movement, through a proposed two-board autonomous robot architecture.",
    technologies: ["Raspberry Pi 3", "Raspberry Pi 4", "SPI", "IR / ultrasonic sensors", "L298N"],
    problem: "The RoboFest Gujarat 5.0 Junior AI Autonomous Driving Bots category prompted a design for lane following, obstacle avoidance, and traffic-signal response.",
    approach: ["Proposed separating camera and AI processing on Raspberry Pi 4 from sensor and motor control on Raspberry Pi 3.", "Planned SPI communication between the boards.", "Considered cameras, IR and ultrasonic sensors, an L298N motor driver, and DC geared motors within competition constraints."],
    outcome: "Robot architecture and component planning. No completed autonomous test performance or competition result is confirmed.",
    limitations: ["A fully assembled robot, implemented perception method, and working board communication are not verified.", "No award, rank, or qualification is claimed."],
  },
];

export const skillGroups = [
  { title: "Project experience", level: "Used in projects", items: ["HTML", "CSS", "JavaScript", "Python", "MySQL", "Tkinter", "Three.js", "Blender", "Botpress AI"] },
  { title: "Software in progress", level: "Learning / developing", items: ["React.js", "Node.js", "Express.js", "Web application development"] },
  { title: "Physical systems", level: "Exploring", items: ["Raspberry Pi", "ESP32 / ESP32-S3", "Sensors", "Motor-control electronics", "SPI", "IoT circuits"] },
  { title: "Intelligence & image", level: "Academic study / exploration", items: ["Generative AI", "Conversational AI", "Large Language Models", "Transformers & attention", "Gemini", "AI visual storytelling"] },
] as const;

export const achievements = [
  { title: "BRAINWIZ", result: "25th place", context: "Amalthea ’25 · IIT Gandhinagar", year: "2025", description: "Secured 25th place in the written quiz competition at the 16th edition of Amalthea. Received a Certificate of Participation." },
  { title: "OlympAI", result: "Stage 2 cleared", context: "LegalOne · Binary Bandits", description: "Team Binary Bandits cleared Stage 2 with the Botpress AI legal-information chatbot project." },
  { title: "Smart India Hackathon", result: "College-level qualified", context: "Meghdoot AI · Among the top 90 teams", description: "Qualified through the college-level round during the first year of B.Tech with the flood-detection team project." },
  { title: "LaserHacks", result: "Participation", context: "Lasell University, USA · UnfairSphere", year: "2025", description: "Participated online on November 15–16, 2025, presenting an ideation-stage cybersecurity concept with team UnfairSphere. No prototype was built. Received a Certificate of Participation." },
] as const;

export const experiments = [
  { title: "Smart Calendar", status: "Exploring", description: "ESP32, LED indicators, LCD tasks, and real-time clock concepts.", slug: "smart-calendar" },
  { title: "Autonomous Driving Robot", status: "Architecture", description: "A proposed Raspberry Pi system connecting perception, sensors, and motors.", slug: "autonomous-robot" },
  { title: "Storyboard to Screen", status: "Academic exploration", description: "Prompt writing and AI scene generation with Gemini and Nano Banana, toward a short video." },
  { title: "Large Language Models", status: "Learning", description: "Academic presentation preparation exploring transformers, attention, and Query / Key / Value." },
] as const;

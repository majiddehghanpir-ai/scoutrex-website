-- ── Pricing Plans ────────────────────────────────────────────────────────────

-- JobRex — Free
INSERT INTO pricing_plans (name, price, billing, currency, description, features, product, popular, visible, display_order)
VALUES (
  'Free',
  '0',
  'month',
  'EUR',
  'Get started with AI-powered job matching at no cost.',
  'AI job matching (5 matches/week)
Living career profile
One-click applications (10/month)
Basic interview tips
Job application tracker',
  'jobrex',
  0,
  1,
  1
);

-- JobRex — Pro
INSERT INTO pricing_plans (name, price, billing, currency, description, features, product, popular, visible, display_order)
VALUES (
  'Pro',
  '19',
  'month',
  'EUR',
  'Everything you need to land your next role, faster.',
  'Unlimited AI job matches
Priority profile visibility to recruiters
Unlimited one-click applications
Personalised career trajectory insights
AI-powered interview preparation
Salary benchmarking & negotiation tips
Real-time application status tracking
Priority support',
  'jobrex',
  1,
  1,
  2
);

-- HireRex — Starter
INSERT INTO pricing_plans (name, price, billing, currency, description, features, product, popular, visible, display_order)
VALUES (
  'Starter',
  '89',
  'month',
  'EUR',
  'Perfect for small teams making their first AI-powered hires.',
  'Up to 5 active job posts
AI candidate matching (top 10 per role)
Basic skills screening
Candidate pipeline board
Email notifications
1 team member seat
Standard support',
  'hirerex',
  0,
  1,
  1
);

-- HireRex — Growth
INSERT INTO pricing_plans (name, price, billing, currency, description, features, product, popular, visible, display_order)
VALUES (
  'Growth',
  '249',
  'month',
  'EUR',
  'Scale your hiring with full AI screening and team collaboration.',
  'Unlimited active job posts
Unlimited AI candidate matching
Automated skills & culture-fit assessments
Collaborative hiring pipeline
Structured interview scorecards
Analytics & time-to-hire reports
Up to 10 team member seats
ATS integrations (Greenhouse, Lever, Workable)
Priority support',
  'hirerex',
  1,
  1,
  2
);

-- HireRex — Enterprise
INSERT INTO pricing_plans (name, price, billing, currency, description, features, product, popular, visible, display_order)
VALUES (
  'Enterprise',
  'Custom',
  '',
  'EUR',
  'Tailored AI recruitment for large organisations and agencies.',
  'Everything in Growth
Dedicated AI model fine-tuned for your roles
Unlimited team seats
Custom integrations & API access
SSO & advanced security controls
Dedicated account manager
SLA guarantee
Custom onboarding & training',
  'hirerex',
  0,
  1,
  3
);

-- ── Job Listings ──────────────────────────────────────────────────────────────

-- Web Designer
INSERT INTO job_listings (title, company, location, department, type, salary, description, deadline, status)
VALUES (
  'Web Designer',
  'ScoutRex',
  'Remote (Europe)',
  'Design',
  'Full-time',
  '€45,000 – €60,000',
  'We are looking for a talented Web Designer to craft beautiful, user-friendly interfaces for our JobRex and HireRex platforms. You will work closely with our product and engineering teams to translate concepts into polished, responsive web experiences.

Responsibilities:
• Design and prototype UI components, landing pages, and marketing assets
• Maintain and evolve our design system across web and mobile breakpoints
• Collaborate with engineers on implementation quality and pixel-perfect delivery
• Conduct usability reviews and iterate based on user feedback

Requirements:
• 2+ years of experience in web/product design
• Proficiency in Figma and modern CSS/HTML fundamentals
• Strong portfolio demonstrating UI and visual design skills
• Familiarity with design systems and component-based thinking
• Bonus: experience with motion design or Framer',
  '2026-05-31',
  'active'
);

-- Sales Representative
INSERT INTO job_listings (title, company, location, department, type, salary, description, deadline, status)
VALUES (
  'Sales Development Representative',
  'ScoutRex',
  'Berlin, DE (Hybrid)',
  'Sales',
  'Full-time',
  '€40,000 – €55,000 + commission',
  'Join our growing sales team and help bring HireRex to hiring teams across Europe. You will be the first point of contact for prospective customers, qualifying leads and booking demos for our account executives.

Responsibilities:
• Research and prospect target accounts in the HR and recruiting space
• Reach out via email, LinkedIn, and phone to generate qualified opportunities
• Run discovery calls to understand customer pain points
• Maintain accurate pipeline data in our CRM
• Collaborate with marketing on outbound campaigns

Requirements:
• 1+ years of B2B sales or SDR experience (SaaS preferred)
• Excellent written and verbal communication in English (German is a plus)
• Self-motivated with a structured, data-driven approach
• Comfortable with rejection and persistent follow-up
• Bonus: familiarity with HR tech or recruitment tools',
  '2026-06-15',
  'active'
);

-- Marketing Specialist
INSERT INTO job_listings (title, company, location, department, type, salary, description, deadline, status)
VALUES (
  'Marketing Specialist',
  'ScoutRex',
  'Remote (Europe)',
  'Marketing',
  'Full-time',
  '€42,000 – €58,000',
  'We are hiring a Marketing Specialist to drive awareness and demand for both JobRex and HireRex. You will own content, campaigns, and growth experiments across our key channels.

Responsibilities:
• Plan and execute multi-channel marketing campaigns (email, SEO, paid, social)
• Write and edit compelling content — blog posts, case studies, newsletters, ads
• Manage and optimise Google Ads and LinkedIn campaigns
• Track and report on key metrics: traffic, MQLs, CAC, conversion rates
• Partner with the product team on launches and feature announcements

Requirements:
• 2+ years in a B2B or SaaS marketing role
• Strong copywriting skills with an eye for brand consistency
• Hands-on experience with HubSpot, Mailchimp, or similar tools
• Analytical mindset — comfortable interpreting data and A/B test results
• Bonus: experience marketing to HR professionals or job seekers',
  '2026-06-30',
  'active'
);

-- Executive Secretary
INSERT INTO job_listings (title, company, location, department, type, salary, description, deadline, status)
VALUES (
  'Executive Assistant',
  'ScoutRex',
  'Berlin, DE (On-site / Hybrid)',
  'Operations',
  'Full-time',
  '€38,000 – €48,000',
  'We are looking for a highly organised Executive Assistant to support our founders and senior leadership team. You will be the operational backbone that keeps our leadership running smoothly.

Responsibilities:
• Manage complex calendars, meeting scheduling, and travel arrangements for the CEO and CTO
• Prepare agendas, meeting notes, and follow-up action items
• Handle internal and external correspondence on behalf of leadership
• Coordinate cross-team projects, deadlines, and deliverables
• Assist with board meeting preparation and investor communications
• Manage office operations and vendor relationships

Requirements:
• 2+ years of experience as an executive assistant or office manager
• Excellent organisational skills and attention to detail
• Fluent in English (German is a strong advantage)
• Discretion in handling confidential information
• Proficient with Google Workspace, Slack, and Notion
• Proactive, calm under pressure, and solutions-oriented',
  '2026-05-15',
  'active'
);

-- Social Media Manager
INSERT INTO job_listings (title, company, location, department, type, salary, description, deadline, status)
VALUES (
  'Social Media Manager',
  'ScoutRex',
  'Remote (Europe)',
  'Marketing',
  'Full-time',
  '€38,000 – €52,000',
  'ScoutRex is growing its brand presence across LinkedIn, Instagram, and X (Twitter), and we need a creative Social Media Manager to lead that charge. You will be the voice of ScoutRex online.

Responsibilities:
• Own and manage all social media channels: LinkedIn, Instagram, X, and TikTok
• Develop and execute a content calendar aligned with product launches and campaigns
• Create and edit engaging posts, short-form videos, graphics, and stories
• Monitor community engagement, respond to comments and DMs, and grow our following
• Track performance metrics and produce weekly/monthly reports
• Partner with the design team on visual assets and brand consistency

Requirements:
• 2+ years managing social media for a brand or agency
• Strong writing and storytelling skills — you know how to make B2B content interesting
• Experience with LinkedIn growth strategies for B2B SaaS
• Comfortable with Canva, CapCut, or similar content creation tools
• Data-driven: you set goals, track numbers, and optimise
• Bonus: experience in HR tech, recruitment, or career development niches',
  '2026-06-01',
  'active'
);

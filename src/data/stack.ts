// Edit this file to update the /stack page. Add an item = add one line.
// `link` is optional. If you use affiliate links, keep `affiliate: true` so the
// page shows the disclosure automatically.

export type StackItem = {
  name: string;
  note?: string;
  link?: string;
  affiliate?: boolean;
  /** Which object in the 3D desk scene this is (see src/scripts/three/desk.ts). Optional. */
  model?: 'ultrawide' | 'vertical' | 'landscape' | 'headphones' | 'airpods' | 'ipad';
};

export type StackGroup = { title: string; items: StackItem[] };

export const software: StackGroup[] = [
  {
    title: 'Power Platform',
    items: [
      { name: 'Power Automate', note: 'Cloud flows, approvals, error handling, SQL and SharePoint integrations' },
      { name: 'Power Apps', note: 'Canvas apps for intake and internal tools' },
      { name: 'Power BI', note: 'Operational reporting' },
      { name: 'Copilot Studio', note: 'Agents for internal Q&A and task routing' },
    ],
  },
  {
    title: 'Data & integration',
    items: [
      { name: 'SQL Server', note: 'Staging tables via on-premises data gateway' },
      { name: 'Intapp Integration Builder', note: 'Rule-based sync into practice systems' },
      { name: 'Foundation IP', note: 'IP management system' },
    ],
  },
  {
    title: 'Microsoft 365',
    items: [
      { name: 'Microsoft Forms', note: 'Structured intake' },
      { name: 'SharePoint', note: 'Lists and document libraries as lightweight data stores' },
      { name: 'Teams', note: 'Adaptive cards for alerts and approvals' },
      { name: 'Infodash', note: 'Intranet platform on SharePoint' },
    ],
  },
  {
    title: 'Delivery & AI tooling',
    items: [
      { name: 'Azure DevOps', note: 'Backlog, work items, wiki' },
      { name: 'GitHub', note: 'Source control for this site' },
      { name: 'Claude', note: 'Drafting, analysis, and code assistance' },
      { name: 'Netlify', note: 'Hosting and deploys for this site' },
    ],
  },
];

export const setup: StackGroup[] = [
  {
    title: 'Displays',
    items: [
      { name: 'Philips Brilliance 499P', model: 'ultrawide', note: '49" super-ultrawide. Flow designer, run history, and SQL side by side' },
      { name: 'Vertical monitor', model: 'vertical', note: 'Long expressions, documentation, and Teams' },
      { name: 'Landscape monitor', model: 'landscape', note: 'Email, calendar, and reference' },
    ],
  },
  {
    title: 'Audio & mobile',
    items: [
      { name: 'Bose headphones', model: 'headphones', note: 'Focus time and calls' },
      { name: 'AirPods Pro', model: 'airpods' },
      { name: 'iPad', model: 'ipad', note: 'Sketching flows and notes' },
    ],
  },
];

// Optional photo of the desk, placed in /public/stack/
export const setupPhoto: { src: string; alt: string } | null = null;

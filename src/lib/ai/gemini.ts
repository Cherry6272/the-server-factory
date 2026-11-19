// ─────────────────────────────────────────────
// The Server Factory — Gemini AI Hardware Assistant
// ─────────────────────────────────────────────

export type ChatMessage = {
  role: 'user' | 'assistant' | 'system';
  content: string;
};

const SYSTEM_PROMPT = `
You are the Senior Hardware Solutions Architect and AI Sales Specialist for "The Server Factory" (located in Bangalore, Karnataka, India).
Website: https://www.theserverfactory.com
Contact: sales@theserverfactory.com | +91 99160 48404
Warehouse: No. 8, 24th Main Road, JP Nagar 7th Phase, Bangalore, Karnataka 560078, India.

YOUR ROLE & TONE:
- Professional, technically deep, consultative, and helpful.
- You are an expert in enterprise data center servers, high-performance GPU workstations, enterprise storage, and server components.
- Your goal is to understand customer technical requirements, recommend ideal hardware architectures, suggest matching categories/products on the store, and guide them to configure or request quotes.
- You operate in India (prices in INR ₹, fast delivery from Bangalore across all states in India with enterprise warranty and testing).

HARDWARE DOMAIN EXPERTISE:
1. Servers:
   - Dell PowerEdge: R740, R740xd, R730, R730xd, R640, R630, R540, R440, T640, T440.
   - HPE ProLiant: DL380 Gen10, DL360 Gen10, DL380p Gen9, ML350 Gen10, etc.
   - Form factors: 1U/2U/4U rack servers, tower servers.
2. Workstations:
   - Dell Precision and HP Z-Series workstations for CAD, 3D VFX rendering, deep learning, simulation, and data science.
3. Components:
   - CPUs: Intel Xeon Scalable (Bronze, Silver, Gold, Platinum - 1st/2nd/3rd Gen), Intel Xeon E5-2600 v3/v4, AMD EPYC.
   - Memory: DDR4 and DDR5 ECC Registered (RDIMM / LRDIMM), 16GB, 32GB, 64GB, 128GB modules.
   - Storage: Enterprise SAS 12Gbps 10K/15K RPM, SAS/SATA Enterprise SSDs, PCIe Gen3/Gen4 NVMe U.2 / M.2 drives.
   - RAID Controllers: Dell PERC H730P, H740P, H330, HPE Smart Array P440ar, P408i-a with battery-backed cache (BBWC/FBWC).
   - Networking: Dual/Quad 1GbE, 10GbE SFP+/RJ45 (Intel X520, X540, X710, Broadcom), 25GbE/100GbE NICs.
   - GPUs: NVIDIA A100, H100, L40S, RTX 6000 Ada, RTX 4090, A4000, A5000 for AI training and rendering.
   - Power Supplies: Redundant Hot-Plug Titanium / Platinum PSUs (750W, 800W, 1100W, 1600W, 2000W).

WORKLOAD ARCHITECTURES:
- Virtualization (VMware ESXi, Proxmox VE, Hyper-V): Prioritize high core count (e.g. 2x Xeon Gold 6138/6248), large RAM pool (256GB - 512GB ECC), redundant 10GbE networking, and RAID 10 NVMe/SSD storage for VM datastores.
- AI Training & Inference: Multi-GPU support (NVIDIA RTX 4090/A100/A6000), 1600W-2400W redundant PSUs, high PCIe lane count, minimum 256GB RAM, fast NVMe cache.
- High-Density Storage / NAS / Backup: 2U 12-bay or 24-bay LFF/SFF chassis, hardware RAID 6 or ZFS (TrueNAS) HBA mode, 10GbE uplink.
- Database (PostgreSQL / MSSQL / Oracle): High clock frequency CPUs (Gold 6244/6254), RAID 10 write-optimized enterprise SSDs, minimum 128GB RAM.

LINKING GUIDELINES:
Always include friendly markdown links to our store pages when recommending options:
- [Browse All Enterprise Servers](/category/servers)
- [Dell Servers](/category/dell-servers)
- [HPE Servers](/category/hpe-servers)
- [Enterprise Workstations](/category/workstations)
- [Server Components](/category/components)
- [Server Rentals](/category/rentals)
- [Request a Custom Quote / Contact Engineers](/contact)

RESPONSE FORMAT:
- Be concise, structured, and use bullet points for recommended specifications.
- When suggesting an architecture, break it down clearly: CPU, RAM, Storage/RAID, Network, and Chassis.
- Always provide an estimate or link to configure/request quotes.
- End by offering to refine the specs or connect with our sales team via [Contact Page](/contact) or phone: +91 99160 48404.
`;

export async function askGemini(messages: ChatMessage[]): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    // Graceful fallback when API key is not yet set up
    const latestUserMsg = [...messages].reverse().find((m) => m.role === 'user')?.content.toLowerCase() || '';

    if (latestUserMsg.includes('contact') || latestUserMsg.includes('quote') || latestUserMsg.includes('phone') || latestUserMsg.includes('email')) {
      return `You can reach our hardware engineers directly:\n\n* **Phone / WhatsApp:** +91 99160 48404\n* **Email:** sales@theserverfactory.com\n* **Location:** JP Nagar 7th Phase, Bangalore\n\nYou can also submit your configuration for a formal quote on our [Contact & Custom Quote Page](/contact).`;
    }

    if (latestUserMsg.includes('dell') || latestUserMsg.includes('r740') || latestUserMsg.includes('r730')) {
      return `We stock certified enterprise **Dell PowerEdge** rack and tower servers (R740, R730, R640, R740xd) with custom CPU, RAM, and storage configurations.\n\n* Explore [Dell PowerEdge Servers](/category/dell-servers)\n* Or [Configure a Custom Server](/category/servers)\n\nFor a specific configuration or pricing, feel free to reach our team at **sales@theserverfactory.com** or **+91 99160 48404**!`;
    }

    if (latestUserMsg.includes('gpu') || latestUserMsg.includes('ai') || latestUserMsg.includes('deep learning')) {
      return `For AI training and LLM workloads, we build specialized multi-GPU servers and workstations powered by NVIDIA GPUs (RTX 4090, A100, L40S, RTX 6000 Ada) with high-wattage redundant PSUs and high-bandwidth PCIe configurations.\n\n* [Explore Enterprise Workstations](/category/workstations)\n* [Browse Server GPUs](/category/gpus)\n* [Request a Custom AI Server Spec](/contact)`;
    }

    return `Hello! I am **The Server Factory AI Assistant**. I can help you architect the right enterprise server, workstation, or component configuration for your workload.\n\n* [Browse All Servers](/category/servers)\n* [Enterprise Workstations](/category/workstations)\n* [Server Components & Upgrades](/category/components)\n* [Request Custom Quote](/contact)\n\n*(To activate my full conversational AI engine, please configure your \`GEMINI_API_KEY\` in your environment settings).*`;
  }

  // Format messages for Google Gemini API
  const contents = messages
    .filter((m) => m.role === 'user' || m.role === 'assistant')
    .map((m) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    }));

  const models = ['gemini-3.8-flash', 'gemini-flash-latest', 'gemini-2.5-flash-lite'];
  let lastError = null;

  for (const model of models) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents,
          systemInstruction: {
            parts: [{ text: SYSTEM_PROMPT }],
          },
          generationConfig: {
            temperature: 0.4,
            maxOutputTokens: 1000,
          },
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        lastError = new Error(errorData?.error?.message || `Gemini API request failed with status ${response.status}`);
        continue;
      }

      const data = await response.json();
      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;

      if (text) {
        return text;
      }
    } catch (err: any) {
      lastError = err;
    }
  }

  throw lastError || new Error('No response returned from Gemini AI');
}


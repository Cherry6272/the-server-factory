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
- Professional, technically deep, consultative, and direct.
- You are an authority on enterprise data center servers, high-performance GPU workstations, enterprise storage, and server components.
- Keep responses concise, punchy, and under 140 words.
- Provide structured specifications using bullet points for CPU, RAM, Storage/RAID, Network, and Chassis.
- Always include relevant internal markdown links so customers can click through directly.

HELPFUL STORE LINKS:
- [Browse All Enterprise Servers](/category/servers)
- [Dell PowerEdge Servers](/category/dell-servers)
- [HPE ProLiant Servers](/category/hpe-servers)
- [Enterprise Workstations](/category/workstations)
- [Server Components & Upgrades](/category/components)
- [Server Rentals](/category/rentals)
- [Request a Custom Quote / Contact Engineers](/contact)

LOGISTICS & WARRANTY:
- Pan-India insured delivery (24-48 hrs South India, 3-5 days nationwide).
- 1 to 3 Years Enterprise Replacement Warranty on all certified systems.
- Complete spare parts stock in Bangalore.
`;

/**
 * Deterministic intent matcher for zero-latency (<1ms) immediate responses.
 * Avoids unnecessary LLM roundtrips and prevents serverless timeouts for common FAQs.
 */
function getInstantIntentReply(message: string): string | null {
  const lower = message.toLowerCase().trim();

  // Quote or Sales inquiries
  if (
    lower.includes('custom quote') ||
    lower.includes('get a quote') ||
    lower.includes('talk to sales') ||
    lower.includes('quotation') ||
    lower.includes('rfq') ||
    (lower.includes('quote') && (lower.includes('how') || lower.includes('want') || lower.includes('need') || lower.includes('request') || lower.includes('can i')))
  ) {
    return `### Getting a Custom Quote is Fast & Simple:

* **Submit Online:** Fill out your required specs on our [Contact & Custom Quote Page](/contact) for a formal PDF quotation.
* **Direct Call / WhatsApp:** Speak directly with our senior hardware engineers at **+91 99160 48404** for instant configuration advice.
* **Email Your BOM:** Send your spec sheet or Bill of Materials to **sales@theserverfactory.com**.

**Quote Turnaround:** Tailored enterprise quotes provided within **2 to 4 business hours** with GST tax invoicing and pan-India shipping terms.

Explore our base systems: [Browse All Servers](/category/servers) · [Workstations](/category/workstations) · [Components](/category/components)`;
  }

  // Contact / Phone / WhatsApp
  if (
    lower.includes('phone') ||
    lower.includes('call') ||
    lower.includes('whatsapp') ||
    lower.includes('contact number') ||
    lower.includes('how to reach') ||
    lower.includes('talk to someone') ||
    lower.includes('customer care')
  ) {
    return `### Contact The Server Factory Engineers:

* **Direct Call / WhatsApp:** **+91 99160 48404** *(Mon–Sat, 9:30 AM – 7:30 PM IST)*
* **Sales & Quotations:** **sales@theserverfactory.com**
* **Technical Support:** **support@theserverfactory.com**
* **Submit Online Spec:** [Contact & Custom Quote Page](/contact)

Feel free to call or WhatsApp us anytime with your hardware requirements or questions!`;
  }

  // Location / Address / Warehouse
  if (
    lower.includes('where are you') ||
    lower.includes('location') ||
    lower.includes('warehouse') ||
    lower.includes('address') ||
    lower.includes('office') ||
    lower.includes('visit')
  ) {
    return `### The Server Factory Warehouse & Labs:

* **Address:** No. 8, 24th Main Road, JP Nagar 7th Phase, Bangalore, Karnataka 560078, India.
* **Facilities:** In-house hardware testing lab, burn-in diagnostics, integration center, and enterprise spare parts depot.
* **Visits & Inspections:** By prior appointment for enterprise enterprise buyers and server inspections.
* **Directions / Inquiries:** Call **+91 99160 48404** or email **sales@theserverfactory.com**.`;
  }

  // Shipping / Delivery PAN India
  if (
    lower.includes('delivery') ||
    lower.includes('shipping') ||
    lower.includes('pan india') ||
    lower.includes('ship to') ||
    lower.includes('transit') ||
    lower.includes('delivering')
  ) {
    return `### PAN-India Safe Logistics & Dispatch:

* **Coverage:** We deliver enterprise servers and components to all states and tier-1/tier-2/tier-3 cities across India.
* **Packaging:** Heavy-duty server foam crating and shock-absorbing industrial packaging.
* **Transit Insurance:** 100% insured transit with verified courier partners (Bluedart, V-Xpress, Safechem).
* **Delivery Time:** Typically 24-48 hours within South India and 3-5 business days across other states.

Need urgent dispatch? Reach our logistics desk at **+91 99160 48404**.`;
  }

  // Warranty / Testing
  if (
    lower.includes('warranty') ||
    lower.includes('guarantee') ||
    lower.includes('burn-in') ||
    lower.includes('testing') ||
    lower.includes('certified')
  ) {
    return `### Enterprise Testing & Warranty Guarantee:

* **Rigorous Testing:** Every server and component undergoes a 72-point hardware inspection, memory MemTest86 diagnostic, CPU stress test, and drive SMART verification before dispatch.
* **Warranty Coverage:** 1 to 3 Years Enterprise Replacement Warranty on all certified servers.
* **Spares Support:** Complete spare parts availability (PSUs, fans, drives, RAID batteries) stocked in our Bangalore warehouse.

Have questions about warranty on a specific server model? Ask me or reach out at **sales@theserverfactory.com**.`;
  }

  return null;
}

export async function askGemini(messages: ChatMessage[]): Promise<string> {
  const latestUserMsg = [...messages].reverse().find((m) => m.role === 'user')?.content || '';

  // 1. Instant deterministic intent check (0ms, avoids any network latency or serverless timeout)
  const instantReply = getInstantIntentReply(latestUserMsg);
  if (instantReply) {
    return instantReply;
  }

  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    // Graceful offline advisor fallback when API key is not configured
    const lower = latestUserMsg.toLowerCase();
    if (lower.includes('dell') || lower.includes('r740') || lower.includes('r730')) {
      return `We stock certified enterprise **Dell PowerEdge** rack and tower servers (R740, R730, R640, R740xd) with custom CPU, RAM, and storage configurations.\n\n* Explore [Dell PowerEdge Servers](/category/dell-servers)\n* Or [Configure a Custom Server](/category/servers)\n\nFor a specific configuration or pricing, feel free to reach our team at **sales@theserverfactory.com** or **+91 99160 48404**!`;
    }

    if (lower.includes('gpu') || lower.includes('ai') || lower.includes('deep learning')) {
      return `For AI training and LLM workloads, we build specialized multi-GPU servers and workstations powered by NVIDIA GPUs (RTX 4090, A100, L40S, RTX 6000 Ada) with high-wattage redundant PSUs and high-bandwidth PCIe configurations.\n\n* [Explore Enterprise Workstations](/category/workstations)\n* [Browse Server GPUs](/category/gpus)\n* [Request a Custom AI Server Spec](/contact)`;
    }

    return `Hello! I am **The Server Factory AI Assistant**. I can help you architect the right enterprise server, workstation, or component configuration for your workload.\n\n* [Browse All Servers](/category/servers)\n* [Enterprise Workstations](/category/workstations)\n* [Server Components & Upgrades](/category/components)\n* [Request Custom Quote](/contact)\n\nFor instant pricing or custom builds, call or WhatsApp our engineers at **+91 99160 48404**.`;
  }

  // Format messages for Google Gemini API
  const contents = messages
    .filter((m) => m.role === 'user' || m.role === 'assistant')
    .map((m) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    }));

  // Fast sub-2s models in priority order
  const FAST_MODELS = ['gemini-3.1-flash-lite-preview', 'gemini-3.1-flash-lite', 'gemini-flash-lite-latest'];
  let lastError: any = null;

  for (const model of FAST_MODELS) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

      // Enforce a strict 4.5-second per-model timeout so we never get close to Netlify's 10s ceiling
      const response = await fetch(url, {
        method: 'POST',
        signal: AbortSignal.timeout(4500),
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents,
          systemInstruction: {
            parts: [{ text: SYSTEM_PROMPT }],
          },
          generationConfig: {
            temperature: 0.3,
            maxOutputTokens: 280, // Concise and fast generation
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

      if (text && text.trim().length > 0) {
        return text.trim();
      }
    } catch (err: any) {
      lastError = err;
      // Continue to next model immediately
    }
  }

  // If all models failed or timed out, return a helpful expert recommendation rather than throwing
  return `### Recommendations for Your Configuration:

For custom specifications and live stock pricing on servers, GPUs, or enterprise storage:

* **Direct Technical Advisory:** Call or WhatsApp our senior engineers at **+91 99160 48404**.
* **Request a Custom Quote:** Submit your configuration on our [Contact & Custom Quote Page](/contact) for a formal PDF quotation.
* **Browse Inventory:** [Enterprise Servers](/category/servers) · [Workstations](/category/workstations) · [Components](/category/components)

Our team in Bangalore provides customized hardware configurations dispatched within 24–48 hours across India.`;
}

'use client';

import { useState } from 'react';
import { AlertTriangle, Globe } from 'lucide-react';

interface CrisisFormData {
  crisisType: string;
  severity: string;
  description: string;
  affectedProducts: string[];
  affectedMarkets: string[];
  timeline: string;
  additionalInfo?: string;
}

interface CrisisResponseFormProps {
  onSubmit: (data: CrisisFormData) => void;
  isProcessing?: boolean;
}

const CRISIS_TYPES = [
  { value: 'contamination', label: 'Contamination', description: 'Bacterial, chemical, or physical contamination' },
  { value: 'allergen', label: 'Allergen Issue', description: 'Undeclared allergens or cross-contamination' },
  { value: 'packaging', label: 'Packaging Error', description: 'Incorrect packaging or labeling' },
  { value: 'regulatory', label: 'Regulatory Issue', description: 'Compliance or regulatory violation' },
  { value: 'supply-chain', label: 'Supply Chain', description: 'Supplier or ingredient quality issue' }
] as const;

const SEVERITY_LEVELS = [
  { value: 'critical', label: 'Critical', description: 'Immediate health risk, requires urgent action', color: 'text-red-500' },
  { value: 'high', label: 'High', description: 'Significant risk, requires immediate attention', color: 'text-orange-500' },
  { value: 'medium', label: 'Medium', description: 'Moderate risk, requires prompt action', color: 'text-yellow-500' },
  { value: 'low', label: 'Low', description: 'Minor issue, requires monitoring', color: 'text-green-500' }
] as const;

const AVAILABLE_MARKETS = ['US', 'UK', 'ES', 'AO', 'MO', 'BR', 'AE', 'EU'] as const;

/** Presets completos com Affected Markets = ['US'] para todos os tipos */
const CRISIS_PRESETS: Record<
  (typeof CRISIS_TYPES)[number]['value'],
  {
    severity: 'critical' | 'high' | 'medium' | 'low';
    description: string;
    products: string[];
    timeline: string;
    additionalInfo: string;
    markets?: string[];
  }
> = {
  // 1) Contamination — Salmonella
  contamination: {
    severity: 'critical',
    description: `Routine/complaint-driven testing detected Salmonella spp. (ISO 6579-1:2017, PCR + cultural confirmation) in Peito de Frango Fresco Lusiaves 500 g (MAP), lot PF250914A, produced on 2025-09-14 at Marinha Grande – Unidade de Transformação (Site LU-MG-01). Confirmation received from ISO/IEC 17025 lab IberLab (PT). Potential consumer exposure if already distributed. Immediate hold-and-trace initiated for all associated lots and shared lines.`,
    products: [
      `Peito de Frango Fresco Lusiaves 500 g (MAP) — Lot PF250914A, EAN 5601234001123`,
      `Peito de Frango Fresco Lusiaves 1 kg (MAP) — Lot PF250915B (precautionary; shared line overlap), EAN 5601234001185`,
      `Peito de Frango em Tiras 400 g — Sub-lots PT-TR250915B-120→240 (same cutting session)`
    ],
    timeline: `Production: 2025-09-14 05:40 (line CART-L2; shift A)
Sampling: 2025-09-15 → Lab receipt: 2025-09-15 → Result confirmed: 2025-09-18 10:55
Distribution window: 2025-09-15 → 2025-09-19 / Customers/Regions: PT (Continente DC Azambuja, Auchan DC Maia, Pingo Doce DC Valongo)
Actions: Hold placed 2025-09-18 11:10; sanitation/CIP + equipment teardown 2025-09-18 21:30; recall decision (Class I, voluntary) 2025-09-18 15:10; ASAE notified 2025-09-18 16:05 (RASFF pre-alert opened).`,
    additionalInfo: `Traceability coverage: 99.4% tracked (gap: 62 packs in transit to PD Valongo last-mile carrier)
Consumer guidance: “Do not consume; dispose safely or return for refund.”
Corrective actions: Intensified environmental/finished-product testing (zones 1–3, per-shift); root cause focus on deboning table drains + evisceration transfer; segregate RTE vs raw traffic flows; supplier audit trigger for liner and MAP film sanitation.
Regulatory comms: Draft press release PR-LU-2025-09-PF; contacts Qualidade (+351 244 000 100), Assuntos Regulatórios (+351 244 000 120).
Security Level (Severity): Critical`,
    markets: ['US']
  },

  // 2) Allergen Issue
  allergen: {
    severity: 'high',
    description: `Potential gluten (wheat) and milk presence not declared on the label for Nuggets de Frango Lusiaves 300 g – “Sem Glúten” lot NG250916C, due to wrong film applied after changeover from standard (contains gluten/milk) variant. Individuals with allergies/intolerances may experience serious reactions.`,
    products: [
      `Nuggets de Frango 300 g – “Sem Glúten” — Lot NG250916C, EAN 5601234500305 (film mismatch; may contain gluten/milk)`,
      `Nuggets de Frango 600 g Family Pack — Lot range NGF250916C-01→04 (packed during the same film change window)`
    ],
    timeline: `Artwork/label approval: 2025-08-22
Packaging run: 2025-09-16 13:50 (line COZ-PK-B1)
Pre-shipment QA: Pass (visual) 2025-09-16
Deviation detected: 2025-09-19 09:20 (customer complaint + internal audit)
Distribution list + ship dates: PT: Continente/Auchan/Pingo Doce DCs — 2025-09-17
Immediate actions: Shipment stop 2025-09-19 10:00; recall scope defined 2025-09-19 12:00; ASAE informed 2025-09-19 12:30.`,
    additionalInfo: `Containment: Line shutdown COZ-PK-B1; deep clean; allergen verification with protein swabs (casein/gluten) — negatives after re-clean; purge run (600 units) + positive release next 3 production days.
Relabel/rework plan: 100% reconciliation of films/labels; rework only for unopened master cases with verified compliant film.
Consumer advisory copy: “If you have gluten or milk allergy/intolerance, do not consume. Return for full refund.”
CAPA: Dual barcode + OCR vision verification; hard interlock until film validated; training refresh (Allergen L2); daily reconciliation report to QA.
Security Level (Severity): High (Critical if any reaction/illness is confirmed)`,
    markets: ['US']
  },

  // 3) Packaging Error
  packaging: {
    severity: 'medium',
    description: `Coxas de Frango Lusiaves 1 kg (MAP), lot CX250917D, packaged 2025-09-17 shows compromised seal rate ~4.5% (micro-leaks on MAP trays) due to sealer jaw misalignment. Food integrity potentially affected via vacuum loss → reduced shelf-life/contamination risk.`,
    products: [
      `Coxas de Frango 1 kg (MAP) — Lot CX250917D, EAN 5601234101014 (micro-leak risk)`,
      `Pernas de Frango 1,5 kg (MAP) — Sub-lots PF-1.5-250917D-100→160 (packed during same sealer setup)`
    ],
    timeline: `Packaging run & line: 2025-09-17 06:10, line MAP-L3
Material/film ID: MAP-Top-75µ-Q3-PT
First defect observed: 2025-09-17 07:05 (bubble test + CO₂ decay trend)
Last good check: 2025-09-17 06:20 (start-up OK)
Lots potentially affected: CX250917D trays 080–340
Disposition: Quarantine 7,200 trays; field retrieval started 2025-09-18 08:40.`,
    additionalInfo: `Seal integrity path: Accelerate micro testing; suspend sales until MAP integrity passes CO₂ decay + dye-penetration; restamp dates post-rework.
Root cause workstream: Sealer jaw parallelism out of spec; install locking shims, add PM post-CIP; raise vision/reject threshold; digitize hourly seal checks.
Customer notice template: CN-PKG-MAP-SEAL-2025-09-CX | Traceability: TR-CX-250917D-v2
Security Level (Severity): Medium (High if micro fails or leak rate >1% post-rework)`,
    markets: ['US']
  },

  // 4) Regulatory Issue
  regulatory: {
    severity: 'medium',
    description: `Non-compliance identified for Fiambre de Peito de Frango Lusiaves 150 g (PT market): front-of-pack “baixo em gordura” claim and nutrition panel legibility (x-height) flagged in self-audit aligned to EU 1169/2011 + EU 1924/2006. Product may require label correction/withdrawal of specific batches until compliant packaging is live.`,
    products: [
      `Fiambre de Peito de Frango 150 g — Lots FFP250901A, FFP250905B, EAN 5601234700156`,
      `Fiambre de Peito de Frango 250 g — Lot FFP250907C (secondary SKU sharing same claim zone template)`
    ],
    timeline: `Inspection/notice issued: Internal QA self-audit — 2025-09-13
Response due: 2025-09-27
Affected lots/shipments: FFP250901A, FFP250905B (PT distribution)
Market entry dates: 2025-09-06 → 2025-09-12
Interim controls: Sales hold on flagged lots 2025-09-13 15:00; relabel artwork v2 2025-09-20; legal review kickoff 2025-09-13 16:30.`,
    additionalInfo: `Required actions: Amend claim to “reduzido teor de gordura” if criteria met or remove claim; adjust nutrition panel font/contrast; update claim substantiation (method + variability).
Communication plan: Upload corrective letter + revised mockups to retailer QA portals.
Risk to consumers: Informational; no safety risk.
CAPA: Strengthen PT label checklist; update spec library with claim decision tree; pre-shipment automated OCR/contrast checks.
Security Level (Severity): Medium (High if retailer stop-sale/enforcement is issued)`,
    markets: ['US']
  },

  // 5) Supply Chain
  'supply-chain': {
    severity: 'medium',
    description: `Supply chain incident affecting refrigerated marinada (salmuera) aditiva MF-12 used in Peito de Frango Marinado 700 g from supplier TecnoFood Additives (PT): cold-chain excursion during transport to LU-MG-01 (reefer unit failure). Potential impact on Peito Marinado 700 g and Tiras de Frango Marinadas 400 g continuity from 2025-09-21.`,
    products: [
      `Peito de Frango Marinado 700 g — Batch PM700-250919B, EAN 5601234300721 (held pending results)`,
      `Tiras de Frango Marinadas 400 g — Batch TFM400-250919A, EAN 5601234300417 (at risk due to shared brine)`,
      `Peito de Frango Marinado 1,5 kg Foodservice — Batch PM1500-250919C (foodservice allocation—priority for continuity planning)`
    ],
    timeline: `Supplier/carrier notification: 2025-09-19 05:10
Incident window: 2025-09-18 22:30 → 2025-09-19 03:20
Our receipts/production using affected inputs: PO 4600098765 — lots MF12-250918A received 2025-09-19 07:20; used in WIP PM700-250919B at 2025-09-19 10:05 (held)
Customer deliveries at risk: Sonae MC #SMC-77211 (2025-09-21); Jerónimo Martins #JM-55344 (2025-09-22)
Mitigations initiated: Alt-source 2025-09-19 08:10 (TecnoFood Alt Plant Braga); inventory reallocation 2025-09-19 09:00; testing upshift 2025-09-19 09:20 (release-on-results only).`,
    additionalInfo: `Quality controls: Verify time–temp logs; accept only pallets ≤4 °C end-to-end; retain samples; 48 h rapid micro + peroxides; block use if >8 °C for >2 h.
Business continuity: Qualify alternative batch MF12-B (approved 2025-03; capacity OK); temporary formulation tweak (NaCl –0.2%) validated by QA.
Temperature excursion protocol: Apply discard criteria; insurer claim #COLD-2025-0919-MF12.
Communication: Proactive ETA + formulation FAQ to major retail QA teams (FAQ-SC-MF12-2025-09).
Security Level (Severity): Medium (Critical if micro fails on held WIP/high-risk products; Low if resolved with alt sourcing)`,
    markets: ['US']
  }
};

export function CrisisResponseForm({ onSubmit, isProcessing = false }: CrisisResponseFormProps) {
  const [formData, setFormData] = useState<CrisisFormData>({
    crisisType: '',
    severity: '',
    description: '',
    affectedProducts: [],
    affectedMarkets: [],
    timeline: '',
    additionalInfo: ''
  });

  const [newProduct, setNewProduct] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleInputChange = (field: keyof CrisisFormData, value: string) => {
    if (field === 'crisisType') {
      const preset = CRISIS_PRESETS[value as keyof typeof CRISIS_PRESETS];
      if (preset) {
        setFormData({
          crisisType: value,
          severity: preset.severity,
          description: preset.description,
          affectedProducts: preset.products,
          affectedMarkets: preset.markets ?? [],
          timeline: preset.timeline,
          additionalInfo: preset.additionalInfo
        });
      } else {
        setFormData(prev => ({ ...prev, crisisType: value }));
      }

      setErrors(prev => ({
        ...prev,
        crisisType: '',
        severity: '',
        description: '',
        affectedProducts: '',
        affectedMarkets: '',
        timeline: ''
      }));
      return;
    }

    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: '' }));
  };

  const handleProductAdd = () => {
    if (newProduct.trim() && !formData.affectedProducts.includes(newProduct.trim())) {
      setFormData(prev => ({
        ...prev,
        affectedProducts: [...prev.affectedProducts, newProduct.trim()]
      }));
      setNewProduct('');
    }
  };

  const handleProductRemove = (product: string) => {
    setFormData(prev => ({
      ...prev,
      affectedProducts: prev.affectedProducts.filter(p => p !== product)
    }));
  };

  const handleMarketToggle = (market: string) => {
    setFormData(prev => ({
      ...prev,
      affectedMarkets: prev.affectedMarkets.includes(market)
        ? prev.affectedMarkets.filter(m => m !== market)
        : [...prev.affectedMarkets, market]
    }));
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!formData.crisisType) newErrors.crisisType = 'Please select a crisis type';
    if (!formData.severity) newErrors.severity = 'Please select severity level';
    if (!formData.description.trim()) newErrors.description = 'Please provide a description';
    if (formData.affectedProducts.length === 0) newErrors.affectedProducts = 'Please specify affected products';
    if (formData.affectedMarkets.length === 0) newErrors.affectedMarkets = 'Please select affected markets';
    if (!formData.timeline.trim()) newErrors.timeline = 'Please provide timeline information';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) onSubmit(formData);
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical': return '🔴';
      case 'high': return '🟠';
      case 'medium': return '🟡';
      case 'low': return '🟢';
      default: return '⚪';
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-8">
        <div className="flex items-center gap-3 mb-6">
          <AlertTriangle className="h-8 w-8 text-red-400" />
          <div>
            <h2 className="text-2xl font-bold text-red-400">Crisis Response Management</h2>
            <p className="text-gray-300">Report and manage food safety incidents</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Crisis Type */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-3">
              Crisis Type <span className="text-red-400">*</span>
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {CRISIS_TYPES.map((type) => (
                <label
                  key={type.value}
                  className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                    formData.crisisType === type.value
                      ? 'border-red-500 bg-red-500/10'
                      : 'border-gray-600 bg-gray-800/50 hover:border-gray-500'
                  }`}
                >
                  <input
                    type="radio"
                    name="crisisType"
                    value={type.value}
                    checked={formData.crisisType === type.value}
                    onChange={(e) => handleInputChange('crisisType', e.target.value)}
                    className="sr-only"
                  />
                  <div className="font-medium text-white">{type.label}</div>
                  <div className="text-sm text-gray-400 mt-1">{type.description}</div>
                </label>
              ))}
            </div>
            {errors.crisisType && <p className="text-red-400 text-sm mt-1">{errors.crisisType}</p>}
          </div>

          {/* Severity Level */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-3">
              Severity Level <span className="text-red-400">*</span>
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {SEVERITY_LEVELS.map((level) => (
                <label
                  key={level.value}
                  className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                    formData.severity === level.value
                      ? 'border-red-500 bg-red-500/10'
                      : 'border-gray-600 bg-gray-800/50 hover:border-gray-500'
                  }`}
                >
                  <input
                    type="radio"
                    name="severity"
                    value={level.value}
                    checked={formData.severity === level.value}
                    onChange={(e) => handleInputChange('severity', e.target.value)}
                    className="sr-only"
                  />
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{getSeverityIcon(level.value)}</span>
                    <div>
                      <div className={`font-medium ${level.color}`}>{level.label}</div>
                      <div className="text-sm text-gray-400">{level.description}</div>
                    </div>
                  </div>
                </label>
              ))}
            </div>
            {errors.severity && <p className="text-red-400 text-sm mt-1">{errors.severity}</p>}
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Crisis Description <span className="text-red-400">*</span>
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Describe the crisis situation in detail..."
              className="w-full p-4 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-red-500 focus:ring-1 focus:ring-red-500"
              rows={5}
            />
            {errors.description && <p className="text-red-400 text-sm mt-1">{errors.description}</p>}
          </div>

          {/* Affected Products */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Affected Products <span className="text-red-400">*</span>
            </label>
            <div className="flex gap-2 mb-3">
              <input
                type="text"
                value={newProduct}
                onChange={(e) => setNewProduct(e.target.value)}
                placeholder="Enter product name"
                className="flex-1 p-3 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-red-500 focus:ring-1 focus:ring-red-500"
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleProductAdd())}
              />
              <button
                type="button"
                onClick={handleProductAdd}
                className="px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              >
                Add
              </button>
            </div>

            {formData.affectedProducts.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {formData.affectedProducts.map((product) => (
                  <span
                    key={product}
                    className="inline-flex items-center gap-2 px-3 py-1 bg-red-600/20 text-red-300 rounded-full text-sm"
                  >
                    {product}
                    <button
                      type="button"
                      onClick={() => handleProductRemove(product)}
                      className="text-red-400 hover:text-red-300"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
            {errors.affectedProducts && <p className="text-red-400 text-sm mt-1">{errors.affectedProducts}</p>}
          </div>

          {/* Affected Markets */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-3">
              Affected Markets <span className="text-red-400">*</span>
            </label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {AVAILABLE_MARKETS.map((market) => (
                <label
                  key={market}
                  className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${
                    formData.affectedMarkets.includes(market)
                      ? 'border-red-500 bg-red-500/10'
                      : 'border-gray-600 bg-gray-800/50 hover:border-gray-500'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={formData.affectedMarkets.includes(market)}
                    onChange={() => handleMarketToggle(market)}
                    className="sr-only"
                  />
                  <div className="flex items-center gap-2">
                    <Globe className="h-4 w-4 text-gray-400" />
                    <span className="font-medium text-white">{market}</span>
                  </div>
                </label>
              ))}
            </div>
            {errors.affectedMarkets && <p className="text-red-400 text-sm mt-1">{errors.affectedMarkets}</p>}
          </div>

          {/* Timeline */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Timeline Information <span className="text-red-400">*</span>
            </label>
            <textarea
              value={formData.timeline}
              onChange={(e) => handleInputChange('timeline', e.target.value)}
              placeholder="Provide timeline details (when discovered, affected dates, etc.)..."
              className="w-full p-4 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-red-500 focus:ring-1 focus:ring-red-500"
              rows={8}
            />
            {errors.timeline && <p className="text-red-400 text-sm mt-1">{errors.timeline}</p>}
          </div>

          {/* Additional Information */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Additional Information
            </label>
            <textarea
              value={formData.additionalInfo}
              onChange={(e) => handleInputChange('additionalInfo', e.target.value)}
              placeholder="Any additional details, contact information, or special instructions..."
              className="w-full p-4 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-red-500 focus:ring-1 focus:ring-red-500"
              rows={8}
            />
          </div>

          {/* Submit Button */}
          <div className="flex gap-4 pt-6">
            <button
              type="submit"
              disabled={isProcessing}
              className="flex-1 px-6 py-3 bg-red-600 hover:bg-red-700 disabled:bg-gray-600 text-white rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              {isProcessing ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Processing Crisis Report...
                </>
              ) : (
                <>
                  <AlertTriangle className="h-4 w-4" />
                  Submit Crisis Report
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

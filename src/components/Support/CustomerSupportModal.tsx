import React, { useState } from 'react';
import { 
  X, 
  HelpCircle, 
  Phone, 
  Mail, 
  MessageSquare, 
  ShieldCheck, 
  ChevronDown, 
  ChevronUp, 
  Search, 
  Ticket, 
  QrCode, 
  Clock, 
  RefreshCw, 
  HeartHandshake,
  Sparkles
} from 'lucide-react';

interface CustomerSupportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface FAQItem {
  id: string;
  category: 'BOOKING' | 'CANCELLATION' | 'QR_CHECKIN' | 'WOMEN_SAFETY' | 'REFUNDS';
  question: string;
  answer: string;
}

const FAQS: FAQItem[] = [
  {
    id: 'faq-1',
    category: 'QR_CHECKIN',
    question: 'How does digital QR Code conductor verification work on boarding?',
    answer: 'Once your payment is confirmed, an encrypted cryptographic QR Code is generated on your E-Ticket. When boarding the bus, simply present this QR code to the conductor. The conductor scans it using the MargPath Conductor App to mark your check-in status as "✓ BOARDED & VERIFIED".'
  },
  {
    id: 'faq-2',
    category: 'CANCELLATION',
    question: 'How can I cancel my ticket and receive an instant refund?',
    answer: 'Go to "View Your Account" -> "View Your Journey", select the active journey ticket, and click "Cancel Ticket & Request Refund". If you opted for Flexi-Ticket cover, you get a 100% full refund up to 2 hours before departure. Regular refunds are processed dynamically according to departure time rules.'
  },
  {
    id: 'faq-3',
    category: 'WOMEN_SAFETY',
    question: 'What is the Women Booking Feature and female adjacent seat policy?',
    answer: 'For female passengers traveling alone, MargPath reserves specific seats highlighted in pink/purple. To ensure comfort and safety, male passengers are automatically restricted from selecting seats adjacent to single female travelers.'
  },
  {
    id: 'faq-4',
    category: 'BOOKING',
    question: 'What happens when I select a seat? Is my seat locked from other users?',
    answer: 'Yes! MargPath utilizes an enterprise Redis 10-Minute Distributed Seat Lock engine. As soon as you select a seat, it is locked strictly for your session for 10 minutes, preventing double-booking across all devices nationwide.'
  },
  {
    id: 'faq-5',
    category: 'REFUNDS',
    question: 'How long does it take for ticket refund credit to appear?',
    answer: 'Instant refunds to your MargPath Wallet Balance are credited within 30 seconds! Bank/UPI account transfers take 1-3 business days depending on your bank.'
  }
];

export const CustomerSupportModal: React.FC<CustomerSupportModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [openFaqId, setOpenFaqId] = useState<string | null>('faq-1');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

  if (!isOpen) return null;

  const filteredFaqs = FAQS.filter(faq => {
    const matchesCategory = selectedCategory === 'ALL' || faq.category === selectedCategory;
    const matchesSearch = faq.question.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          faq.answer.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/65 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl border border-gray-100 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header Ribbon */}
        <div className="bg-gradient-to-r from-[#D84E55] to-[#B83E44] text-white p-6 relative">
          <button
            onClick={onClose}
            className="absolute top-5 right-5 w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center text-white">
              <HelpCircle className="w-7 h-7" />
            </div>
            <div>
              <h3 className="text-xl font-black text-white">24x7 Customer Support & Help Center</h3>
              <p className="text-xs text-red-100 mt-0.5">
                Instant assistance for bookings, QR check-in verification, ticket cancellations, and refunds
              </p>
            </div>
          </div>

          {/* Search Input inside ribbon */}
          <div className="relative mt-4">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search help articles (e.g. refund, QR code, cancellation, seat lock)..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full bg-white text-gray-900 placeholder-gray-400 text-xs rounded-xl pl-10 pr-4 py-2.5 shadow-sm focus:outline-none font-medium"
            />
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 max-h-[65vh] overflow-y-auto space-y-5 text-gray-800">
          
          {/* Direct Support Channels Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-3.5 rounded-2xl bg-red-50 border border-red-100 flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#D84E55] text-white flex items-center justify-center shrink-0 shadow-xs">
                <Phone className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-gray-400 block">Toll-Free Helpline</span>
                <span className="text-xs font-black text-gray-900 font-mono">1800-200-8800</span>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                <MessageSquare className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-gray-400 block">WhatsApp Support</span>
                <span className="text-xs font-black text-gray-900 font-mono">+91 94383 18821</span>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-blue-50 border border-blue-100 flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                <Mail className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-gray-400 block">Email Desk</span>
                <span className="text-xs font-bold text-gray-900">support@wabus.in</span>
              </div>
            </div>
          </div>

          {/* Category Filter Chips */}
          <div className="flex flex-wrap gap-1.5 pt-1">
            {[
              { id: 'ALL', label: 'All FAQs' },
              { id: 'QR_CHECKIN', label: 'QR Check-in & Boarding' },
              { id: 'CANCELLATION', label: 'Cancellation & Flexi Cover' },
              { id: 'REFUNDS', label: 'Refund Tracking' },
              { id: 'WOMEN_SAFETY', label: 'Women Safety Features' },
              { id: 'BOOKING', label: 'Seat Locks & Payments' }
            ].map(cat => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                  selectedCategory === cat.id
                    ? 'bg-gray-900 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* FAQs Accordion */}
          <div className="space-y-3 pt-2">
            <h4 className="text-xs font-black text-gray-900 uppercase tracking-wider flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#D84E55]" />
              <span>Frequently Asked Questions ({filteredFaqs.length})</span>
            </h4>

            {filteredFaqs.length === 0 ? (
              <div className="text-center py-8 text-gray-400 text-xs">
                No matching help articles found for "{searchQuery}". Contact our 24x7 desk above!
              </div>
            ) : (
              filteredFaqs.map(faq => {
                const isOpen = openFaqId === faq.id;
                return (
                  <div 
                    key={faq.id}
                    className="border border-gray-200 rounded-2xl overflow-hidden transition"
                  >
                    <button
                      onClick={() => setOpenFaqId(isOpen ? null : faq.id)}
                      className="w-full text-left p-4 bg-gray-50/50 hover:bg-gray-50 flex items-center justify-between gap-3 text-xs font-bold text-gray-900 cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-[#D84E55] shrink-0" />
                        <span>{faq.question}</span>
                      </div>
                      {isOpen ? <ChevronUp className="w-4 h-4 text-gray-500 shrink-0" /> : <ChevronDown className="w-4 h-4 text-gray-500 shrink-0" />}
                    </button>

                    {isOpen && (
                      <div className="p-4 bg-white border-t border-gray-100 text-xs text-gray-600 leading-relaxed animate-in fade-in duration-150">
                        {faq.answer}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

import React, { useState, useRef, useEffect } from 'react';
import {
  Sparkles,
  Search,
  MapPin,
  Bot,
  Send,
  Loader2,
  ExternalLink,
  RefreshCw,
  Copy,
  Check,
  Building,
  Landmark,
  ShieldAlert,
  HelpCircle,
  Cpu,
  Zap,
  Compass,
  FileText,
  User,
  Scale,
  DollarSign
} from 'lucide-react';
import { OutputLanguage, AccountingFramework, CompanyEntity, AccountRow } from '../../types/accounting';

interface Props {
  language: OutputLanguage;
  framework: AccountingFramework;
  company: CompanyEntity;
  accounts: AccountRow[];
}

interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: string;
  model?: string;
  groundingSources?: Array<{ title?: string; uri?: string }>;
}

export const GeminiStudio: React.FC<Props> = ({
  language,
  framework,
  company,
  accounts
}) => {
  const isAr = language === 'ar';
  const [activeTab, setActiveTab] = useState<'chat' | 'search' | 'maps'>('chat');

  // Chat State
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'model',
      text: isAr
        ? `أهلاً بك في **استوديو الذكاء الاصطناعي المالي (Ledger IQ Copilot)**. أنا مساعدك الاستراتيجي المعتمد على نماذج Gemini المتقدمة. يمكنني فحص وتدقيق ميزان المراجعة، تقديم المشورة بشأن معايير المحاسبة المصرية (EAS) والدولية (IFRS)، وتحليل نسب رأس المال العامل والسيولة، أو إجراء أبحاث فورية عبر Google Search وخرائط Google Maps.`
        : `Welcome to the **Ledger IQ Financial AI Studio**. I am your executive financial co-pilot powered by Gemini models. I can analyze trial balances, advise on Egyptian Accounting Standards (EAS) & IFRS, calculate working capital metrics, or perform live grounding via Google Search and Google Maps.`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      model: 'gemini-3.8-flash'
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [selectedRole, setSelectedRole] = useState<'cfo_advisor' | 'tax_auditor' | 'treasury_fx' | 'forensic_auditor'>('cfo_advisor');
  const [selectedModel, setSelectedModel] = useState<'gemini-3.8-flash' | 'gemini-3.1-flash-lite' | 'gemini-4-argon'>('gemini-3.8-flash');
  const [chatSearchGrounding, setChatSearchGrounding] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Search Grounding State
  const [searchQuery, setSearchQuery] = useState('');
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchResult, setSearchResult] = useState<{
    text: string;
    sources: Array<{ title?: string; uri?: string }>;
  } | null>(null);

  // Maps Grounding State
  const [mapsQuery, setMapsQuery] = useState('');
  const [mapsLoading, setMapsLoading] = useState(false);
  const [mapsResult, setMapsResult] = useState<{
    text: string;
    places: Array<{ title: string; uri: string }>;
  } | null>(null);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number }>({
    lat: 30.0444, // Cairo default
    lng: 31.2357
  });
  const [locationName, setLocationName] = useState<string>('القاهرة، مصر (Cairo, Egypt)');

  // Auto-scroll chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, chatLoading]);

  // Request browser geolocation if available
  const handleDetectLocation = () => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
          setLocationName(
            isAr
              ? `إحداثياتك الحالية (${position.coords.latitude.toFixed(4)}, ${position.coords.longitude.toFixed(4)})`
              : `Current Location (${position.coords.latitude.toFixed(4)}, ${position.coords.longitude.toFixed(4)})`
          );
        },
        () => {
          // fallback to Cairo
          setUserLocation({ lat: 30.0444, lng: 31.2357 });
        }
      );
    }
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Chat Submission
  const handleSendMessage = async (e?: React.FormEvent, customPrompt?: string) => {
    if (e) e.preventDefault();
    const promptToSend = customPrompt || inputMessage;
    if (!promptToSend.trim() || chatLoading) return;

    const userMsgId = `usr-${Date.now()}`;
    const userMsg: ChatMessage = {
      id: userMsgId,
      role: 'user',
      text: promptToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!customPrompt) setInputMessage('');
    setChatLoading(true);

    try {
      // Build history payload
      const historyPayload = messages
        .filter((m) => m.id !== 'welcome')
        .map((m) => ({
          role: m.role,
          text: m.text
        }));

      const response = await fetch('/api/gemini/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: promptToSend,
          history: historyPayload,
          role: selectedRole,
          model: selectedModel,
          enableSearch: chatSearchGrounding,
          companyContext: {
            name: isAr ? company.nameAr : company.nameEn,
            framework,
            currency: company.baseCurrency,
            scale: company.scale,
            accountCount: accounts.length
          }
        })
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to generate response');
      }

      // Extract web sources if search was grounded
      const sources: Array<{ title?: string; uri?: string }> = [];
      if (Array.isArray(data.groundingChunks)) {
        for (const chunk of data.groundingChunks) {
          if (chunk.web && chunk.web.uri) {
            sources.push({
              title: chunk.web.title || chunk.web.uri,
              uri: chunk.web.uri
            });
          }
        }
      }

      const botMsg: ChatMessage = {
        id: `bot-${Date.now()}`,
        role: 'model',
        text: data.text,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        model: data.model,
        groundingSources: sources.length > 0 ? sources : undefined
      };

      setMessages((prev) => [...prev, botMsg]);
    } catch (err: any) {
      console.error('Chat error:', err);
      const errMsg: ChatMessage = {
        id: `err-${Date.now()}`,
        role: 'model',
        text: isAr
          ? `عذراً، حدث خطأ أثناء معالجة الطلب عبر Gemini: ${err.message}`
          : `Sorry, an error occurred while querying Gemini: ${err.message}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        model: selectedModel
      };
      setMessages((prev) => [...prev, errMsg]);
    } finally {
      setChatLoading(false);
    }
  };

  // Search Grounding Submission
  const handleSearchSubmit = async (e?: React.FormEvent, customQuery?: string) => {
    if (e) e.preventDefault();
    const query = customQuery || searchQuery;
    if (!query.trim() || searchLoading) return;

    setSearchLoading(true);
    setSearchResult(null);

    try {
      const res = await fetch('/api/gemini/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query,
          language
        })
      });

      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Search grounding failed');

      setSearchResult({
        text: data.text,
        sources: data.webSources || []
      });
    } catch (err: any) {
      console.error('Search error:', err);
      setSearchResult({
        text: isAr ? `فشل الاستعلام من خلال Google Search: ${err.message}` : `Google Search query failed: ${err.message}`,
        sources: []
      });
    } finally {
      setSearchLoading(false);
    }
  };

  // Maps Grounding Submission
  const handleMapsSubmit = async (e?: React.FormEvent, customPrompt?: string) => {
    if (e) e.preventDefault();
    const prompt = customPrompt || mapsQuery;
    if (!prompt.trim() || mapsLoading) return;

    setMapsLoading(true);
    setMapsResult(null);

    try {
      const res = await fetch('/api/gemini/maps', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          lat: userLocation.lat,
          lng: userLocation.lng,
          language
        })
      });

      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Maps grounding failed');

      setMapsResult({
        text: data.text,
        places: data.mapPlaces || []
      });
    } catch (err: any) {
      console.error('Maps error:', err);
      setMapsResult({
        text: isAr ? `فشل الاستعلام من خلال خرائط Google: ${err.message}` : `Google Maps query failed: ${err.message}`,
        places: []
      });
    } finally {
      setMapsLoading(false);
    }
  };

  const rolesList = [
    {
      id: 'cfo_advisor',
      labelEn: 'CFO Strategic Advisor',
      labelAr: 'المستشار المالي الاستراتيجي (CFO)',
      icon: Scale,
      color: 'text-blue-400'
    },
    {
      id: 'tax_auditor',
      labelEn: 'Egyptian Tax & EAS Specialist',
      labelAr: 'خبير الضرائب والمعايير المصرية (EAS)',
      icon: Landmark,
      color: 'text-amber-400'
    },
    {
      id: 'treasury_fx',
      labelEn: 'Treasury & FX Analyst',
      labelAr: 'محلل الخزينة وأسعار الصرف (CBE)',
      icon: DollarSign,
      color: 'text-emerald-400'
    },
    {
      id: 'forensic_auditor',
      labelEn: 'Forensic Audit & Controls',
      labelAr: 'مدقق الحسابات الجنائي والرقابة',
      icon: ShieldAlert,
      color: 'text-purple-400'
    }
  ];

  return (
    <div className="space-y-6" dir={isAr ? 'rtl' : 'ltr'}>
      {/* Top Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-[#0B152F] to-slate-900 border border-slate-800 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="px-2.5 py-0.5 rounded text-[11px] font-bold uppercase bg-blue-500/20 text-blue-300 border border-blue-500/30 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-blue-400" />
                Gemini Multi-Modal Grounding Studio
              </span>
              <span className="text-xs text-slate-400 font-mono">
                {isAr ? 'مدعوم بنماذج Gemini 3.8 Flash & Argon' : 'Powered by Gemini 3.8 Flash & Argon'}
              </span>
            </div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2.5">
              <Bot className="w-7 h-7 text-blue-400" />
              {isAr ? 'استوديو الذكاء الاصطناعي والبحث الميداني' : 'Gemini AI Copilot & Grounding Studio'}
            </h1>
            <p className="text-xs text-slate-300 mt-1 max-w-2xl">
              {isAr
                ? 'استشارات مالية متعددة الجولات، بحث وتدقيق مباشر للقوانين والمعايير عبر Google Search، وتحديد مقرات مأموريات الضرائب والبنوك ومكاتب التدقيق عبر Google Maps Grounding.'
                : 'Multi-turn executive financial advisory, live regulatory verification with Google Search Grounding, and physical tax office / bank location intelligence via Google Maps Grounding.'}
            </p>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center p-1 rounded-xl bg-slate-950/80 border border-slate-800 gap-1 self-start md:self-auto">
            <button
              onClick={() => setActiveTab('chat')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'chat'
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Bot className="w-4 h-4" />
              {isAr ? 'مساعد المحادثة المالي' : 'Chat Copilot'}
            </button>
            <button
              onClick={() => setActiveTab('search')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'search'
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Search className="w-4 h-4" />
              {isAr ? 'بحث المعايير واللوائح (Search)' : 'Search Grounding'}
            </button>
            <button
              onClick={() => setActiveTab('maps')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'maps'
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <MapPin className="w-4 h-4" />
              {isAr ? 'المقرات والمأموريات (Maps)' : 'Maps Grounding'}
            </button>
          </div>
        </div>
      </div>

      {/* TAB 1: MULTI-TURN CHAT INTERFACE */}
      {activeTab === 'chat' && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Left / Sidebar Controls */}
          <div className="lg:col-span-1 space-y-4">
            {/* Persona / Role Selector */}
            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
                {isAr ? 'دور المساعد الاستشاري' : 'Assistant Persona & Role'}
              </span>
              <div className="space-y-1.5">
                {rolesList.map((r) => {
                  const Icon = r.icon;
                  const isSelected = selectedRole === r.id;
                  return (
                    <button
                      key={r.id}
                      onClick={() => setSelectedRole(r.id as any)}
                      className={`w-full text-start p-2.5 rounded-xl border text-xs font-medium transition-all flex items-center gap-2.5 ${
                        isSelected
                          ? 'bg-blue-950/60 border-blue-500/50 text-white shadow-sm'
                          : 'bg-slate-950/50 border-slate-800/80 text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                      }`}
                    >
                      <Icon className={`w-4 h-4 shrink-0 ${r.color}`} />
                      <span className="leading-snug">{isAr ? r.labelAr : r.labelEn}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Model Architecture Selector */}
            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
                {isAr ? 'نموذج الذكاء الاصطناعي' : 'Gemini Model Architecture'}
              </span>
              <div className="space-y-2 text-xs">
                <button
                  onClick={() => setSelectedModel('gemini-3.8-flash')}
                  className={`w-full p-2.5 rounded-xl border text-start transition-all ${
                    selectedModel === 'gemini-3.8-flash'
                      ? 'bg-blue-950/70 border-blue-500 text-white'
                      : 'bg-slate-950/50 border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  <div className="flex items-center justify-between font-bold">
                    <span>gemini-3.8-flash</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-400">Default</span>
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1">
                    {isAr ? 'المهام العامة والتحليل السريع مع دعم البحث' : 'General tasks with multi-modal reasoning & search'}
                  </div>
                </button>

                <button
                  onClick={() => setSelectedModel('gemini-3.1-flash-lite')}
                  className={`w-full p-2.5 rounded-xl border text-start transition-all ${
                    selectedModel === 'gemini-3.1-flash-lite'
                      ? 'bg-blue-950/70 border-blue-500 text-white'
                      : 'bg-slate-950/50 border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  <div className="flex items-center justify-between font-bold">
                    <span className="flex items-center gap-1.5">
                      <Zap className="w-3.5 h-3.5 text-amber-400" />
                      gemini-3.1-flash-lite
                    </span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400">Fast</span>
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1">
                    {isAr ? 'استجابة فائقة السرعة للملخصات السريعة' : 'Low-latency for quick financial Q&A'}
                  </div>
                </button>

                <button
                  onClick={() => setSelectedModel('gemini-4-argon')}
                  className={`w-full p-2.5 rounded-xl border text-start transition-all ${
                    selectedModel === 'gemini-4-argon'
                      ? 'bg-blue-950/70 border-blue-500 text-white'
                      : 'bg-slate-950/50 border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  <div className="flex items-center justify-between font-bold">
                    <span className="flex items-center gap-1.5">
                      <Cpu className="w-3.5 h-3.5 text-purple-400" />
                      gemini-4-argon
                    </span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-400">Deep Reasoning</span>
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1">
                    {isAr ? 'المهام المعقدة والنمذجة المالية الاستدلالية' : 'Complex STEM & mathematical accounting logic'}
                  </div>
                </button>
              </div>

              {/* Search Grounding toggle inside chat */}
              <div className="pt-2 border-t border-slate-800">
                <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-300">
                  <input
                    type="checkbox"
                    checked={chatSearchGrounding}
                    onChange={(e) => setChatSearchGrounding(e.target.checked)}
                    className="rounded bg-slate-950 border-slate-700 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="flex items-center gap-1.5 font-medium">
                    <Search className="w-3.5 h-3.5 text-blue-400" />
                    {isAr ? 'تفعيل البحث المباشر (Google Search Grounding)' : 'Enable Live Google Search'}
                  </span>
                </label>
              </div>
            </div>

            {/* Quick Prompt Starters */}
            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                {isAr ? 'أسئلة تنفيذية سريعة' : 'Executive Inquiries'}
              </span>
              <div className="space-y-1.5">
                {[
                  {
                    ar: 'حلل كفاءة رأس المال العامل ودورة التحويل النقدي (CCC)',
                    en: 'Analyze working capital efficiency & Cash Conversion Cycle'
                  },
                  {
                    ar: 'ما هي شروط الاعتراف بالإيراد وفق معيار EAS 48؟',
                    en: 'What are EAS 48 revenue recognition criteria?'
                  },
                  {
                    ar: 'فحص تأثير فروق أسعار الصرف وفق معيار EAS 13',
                    en: 'Assess EAS 13 foreign exchange translation impact'
                  },
                  {
                    ar: 'توصيات لخفض فوائد السحب على المكشوف البنكي',
                    en: 'Recommendations to reduce overdraft interest expense'
                  }
                ].map((item, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSendMessage(undefined, isAr ? item.ar : item.en)}
                    className="w-full text-start p-2 rounded-lg bg-slate-950/60 hover:bg-blue-900/30 border border-slate-800 text-[11px] text-slate-300 hover:text-blue-300 transition-colors"
                  >
                    &bull; {isAr ? item.ar : item.en}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Right: Scrollable Chat Thread */}
          <div className="lg:col-span-3 flex flex-col h-[700px] rounded-2xl bg-slate-900/90 border border-slate-800 overflow-hidden shadow-2xl">
            {/* Chat Thread Header */}
            <div className="p-4 border-b border-slate-800 bg-[#0B132B]/80 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-blue-600/30 border border-blue-500/40 flex items-center justify-center text-blue-400">
                  <Bot className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-sm font-bold text-white flex items-center gap-2">
                    <span>
                      {selectedRole === 'cfo_advisor'
                        ? isAr ? 'المستشار المالي الاستراتيجي (CFO)' : 'CFO Strategic Advisor'
                        : selectedRole === 'tax_auditor'
                        ? isAr ? 'خبير الضرائب والمعايير المصرية (EAS)' : 'Egyptian Tax & EAS Specialist'
                        : selectedRole === 'treasury_fx'
                        ? isAr ? 'محلل الخزينة وأسعار الصرف' : 'Treasury & FX Analyst'
                        : isAr ? 'مدقق الحسابات الجنائي والرقابة' : 'Forensic Audit & Controls'}
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                      {selectedModel}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400">
                    {isAr ? company.nameAr : company.nameEn} &bull; {framework} &bull; {accounts.length} {isAr ? 'حساب في الميزان' : 'Ledger Accounts'}
                  </div>
                </div>
              </div>

              <button
                onClick={() => setMessages([messages[0]])}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 text-xs flex items-center gap-1.5 transition-colors"
                title={isAr ? 'مسح المحادثة والبدء من جديد' : 'Clear chat history'}
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{isAr ? 'إعادة ضبط' : 'Clear'}</span>
              </button>
            </div>

            {/* Scrollable Messages Thread */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((msg) => {
                const isUser = msg.role === 'user';
                return (
                  <div
                    key={msg.id}
                    className={`flex items-start gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
                  >
                    <div
                      className={`w-8 h-8 rounded-xl shrink-0 flex items-center justify-center text-xs font-bold ${
                        isUser
                          ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                          : 'bg-slate-800 text-blue-400 border border-slate-700'
                      }`}
                    >
                      {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                    </div>

                    <div
                      className={`max-w-[85%] rounded-2xl p-4 text-xs space-y-2 border shadow-lg ${
                        isUser
                          ? 'bg-blue-600 text-white border-blue-500 rounded-tr-none'
                          : 'bg-slate-950/80 text-slate-200 border-slate-800 rounded-tl-none'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-4 text-[10px] opacity-75">
                        <span className="font-semibold">{isUser ? (isAr ? 'المستخدم' : 'You') : 'Gemini Intelligence'}</span>
                        <div className="flex items-center gap-2">
                          <span>{msg.timestamp}</span>
                          {!isUser && (
                            <button
                              onClick={() => handleCopy(msg.id, msg.text)}
                              className="hover:text-white transition-colors"
                              title="Copy text"
                            >
                              {copiedId === msg.id ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                            </button>
                          )}
                        </div>
                      </div>

                      <div className="whitespace-pre-line leading-relaxed text-sm">
                        {msg.text}
                      </div>

                      {/* Search Grounding Sources */}
                      {msg.groundingSources && msg.groundingSources.length > 0 && (
                        <div className="pt-3 mt-3 border-t border-slate-800/80 space-y-1.5">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-blue-400 flex items-center gap-1">
                            <Search className="w-3 h-3" />
                            {isAr ? 'مصادر البحث المباشرة (Google Search Grounding):' : 'Grounded Search Sources:'}
                          </span>
                          <div className="flex flex-wrap gap-2">
                            {msg.groundingSources.map((src, sIdx) => (
                              <a
                                key={sIdx}
                                href={src.uri}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-900 border border-slate-800 text-[11px] text-blue-300 hover:text-white hover:border-blue-500 transition-colors"
                              >
                                <ExternalLink className="w-3 h-3 shrink-0 text-blue-400" />
                                <span className="truncate max-w-[220px]">{src.title || src.uri}</span>
                              </a>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}

              {chatLoading && (
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-slate-800 text-blue-400 flex items-center justify-center">
                    <Loader2 className="w-4 h-4 animate-spin" />
                  </div>
                  <div className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800 text-xs text-slate-400 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-blue-400 animate-pulse" />
                    <span>{isAr ? 'جاري التحليل وتوليد الإجابة بواسطة Gemini...' : 'Generating financial intelligence via Gemini...'}</span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Bar */}
            <form onSubmit={handleSendMessage} className="p-3 bg-slate-950 border-t border-slate-800 flex items-center gap-2">
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder={
                  isAr
                    ? 'اكتب استفسارك المالي أو الضريبي أو المحاسبي هنا...'
                    : 'Ask your corporate accounting, tax, or treasury question...'
                }
                className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500"
              />
              <button
                type="submit"
                disabled={chatLoading || !inputMessage.trim()}
                className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold text-xs flex items-center gap-2 transition-all shadow-lg shadow-blue-600/30"
              >
                {chatLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                <span>{isAr ? 'إرسال' : 'Send'}</span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* TAB 2: GOOGLE SEARCH GROUNDING */}
      {activeTab === 'search' && (
        <div className="space-y-6">
          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
                <Search className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">
                  {isAr ? 'محرك البحث المالي المدقق (Google Search Grounding)' : 'Live Regulatory & Market Search Grounding'}
                </h3>
                <p className="text-xs text-slate-400">
                  {isAr
                    ? 'التحقق الفوري من التعديلات التشريعية، أسعار الفائدة الحالية للبنك المركزي، وقرارات مصلحة الضرائب المصرية باستخدام نموذج gemini-3.8-flash مع أداة googleSearch.'
                    : 'Real-time retrieval of Egyptian tax amendments, CBE monetary rates, and market benchmarks using gemini-3.8-flash with the googleSearch tool.'}
                </p>
              </div>
            </div>

            {/* Search Input */}
            <form onSubmit={handleSearchSubmit} className="flex gap-2">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={
                  isAr
                    ? 'مثال: أسعار الفائدة الرسمية للبنك المركزي المصري اليوم، أو تعديلات قانون ضريبة الدخل 2025...'
                    : 'e.g., Current Central Bank of Egypt corridor rates 2025, or ETA e-invoicing mandatory phases...'
                }
                className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
              />
              <button
                type="submit"
                disabled={searchLoading || !searchQuery.trim()}
                className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold text-xs flex items-center gap-2 transition-all shadow-lg shadow-blue-600/30"
              >
                {searchLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                <span>{isAr ? 'بحث مدقق' : 'Search Live'}</span>
              </button>
            </form>

            {/* Preset Regulatory Queries */}
            <div className="flex flex-wrap gap-2 pt-2">
              <span className="text-xs text-slate-400 self-center">
                {isAr ? 'استعلامات تنظيمية شائعة:' : 'Trending regulatory searches:'}
              </span>
              {[
                {
                  ar: 'أسعار الفائدة وسعر الإقراض والخصم للبنك المركزي المصري حالياً',
                  en: 'Current Central Bank of Egypt (CBE) corridor policy rates'
                },
                {
                  ar: 'آخر تعديلات قانون الإجراءات الضريبية الموحد رقم 206 لسنة 2020',
                  en: 'Latest updates on Egyptian Unified Tax Procedures Law 206/2020'
                },
                {
                  ar: 'مراحل إلزام الفاتورة والإيصال الإلكتروني مصلحة الضرائب المصرية',
                  en: 'ETA Egyptian Tax Authority e-invoicing mandatory phases'
                },
                {
                  ar: 'معيار المحاسبة المصري رقم (13) المعدل لآثار التغير في أسعار الصرف',
                  en: 'EAS 13 Egyptian Accounting Standard foreign exchange rate amendments'
                }
              ].map((q, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    const text = isAr ? q.ar : q.en;
                    setSearchQuery(text);
                    handleSearchSubmit(undefined, text);
                  }}
                  className="px-3 py-1.5 rounded-lg bg-slate-950/70 hover:bg-blue-900/40 border border-slate-800 text-[11px] text-slate-300 hover:text-blue-300 transition-colors"
                >
                  {isAr ? q.ar : q.en}
                </button>
              ))}
            </div>
          </div>

          {/* Search Results Display */}
          {searchLoading && (
            <div className="p-12 text-center rounded-2xl bg-slate-900/60 border border-slate-800">
              <Loader2 className="w-8 h-8 text-blue-500 animate-spin mx-auto mb-3" />
              <div className="text-sm font-bold text-white">
                {isAr ? 'جاري استرجاع البيانات واللوائح عبر Google Search...' : 'Grounding response via Google Search...'}
              </div>
              <div className="text-xs text-slate-400 mt-1 font-mono">gemini-3.8-flash &bull; googleSearch</div>
            </div>
          )}

          {searchResult && (
            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <span className="text-xs font-bold uppercase tracking-wider text-blue-400 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4" />
                  {isAr ? 'التقرير المدقق بالأدلة والوثائق' : 'Grounded Intelligence Briefing'}
                </span>
                <span className="text-[11px] font-mono text-slate-400">gemini-3.8-flash</span>
              </div>

              <div className="text-xs sm:text-sm text-slate-200 whitespace-pre-line leading-relaxed space-y-3 font-sans">
                {searchResult.text}
              </div>

              {/* Citations & Source Links */}
              {searchResult.sources && searchResult.sources.length > 0 && (
                <div className="pt-4 border-t border-slate-800 space-y-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <ExternalLink className="w-3.5 h-3.5 text-blue-400" />
                    {isAr ? 'المصادر والروابط الرسمية الموثقة:' : 'Verified External Citations & Sources:'}
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {searchResult.sources.map((src, idx) => (
                      <a
                        key={idx}
                        href={src.uri}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-3 rounded-xl bg-slate-950 hover:bg-slate-800/80 border border-slate-800 hover:border-blue-500 transition-all flex items-center justify-between gap-3 group"
                      >
                        <div className="overflow-hidden">
                          <div className="text-xs font-semibold text-slate-200 group-hover:text-blue-300 truncate">
                            {src.title || src.uri}
                          </div>
                          <div className="text-[10px] text-slate-500 truncate font-mono mt-0.5">
                            {src.uri}
                          </div>
                        </div>
                        <ExternalLink className="w-4 h-4 text-slate-500 group-hover:text-blue-400 shrink-0" />
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: GOOGLE MAPS GROUNDING */}
      {activeTab === 'maps' && (
        <div className="space-y-6">
          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-emerald-600/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                  <MapPin className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">
                    {isAr ? 'دليل المقرات والمأموريات المالية (Google Maps Grounding)' : 'Financial Facility & Tax Authority Locator'}
                  </h3>
                  <p className="text-xs text-slate-400">
                    {isAr
                      ? 'تحديد مواقع مراكز كبار الممولين، مأموريات الضرائب، فروع البنك المركزي، ومكاتب كبرى شركات التدقيق عبر gemini-3.8-flash مع أداة googleMaps.'
                      : 'Locate ETA Senior Taxpayer Centers, district tax offices, CBE facilities, and Big 4 audit firms with gemini-3.8-flash Maps Grounding.'}
                  </p>
                </div>
              </div>

              {/* Location Badge & Geolocation trigger */}
              <div className="flex items-center gap-2">
                <div className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 flex items-center gap-2">
                  <Compass className="w-4 h-4 text-blue-400" />
                  <span className="font-mono text-[11px]">{locationName}</span>
                </div>
                <button
                  onClick={handleDetectLocation}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-white flex items-center gap-1.5 transition-colors"
                  title="Detect GPS location"
                >
                  <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{isAr ? 'تحديد موقعي' : 'Use My GPS'}</span>
                </button>
              </div>
            </div>

            {/* Maps Query Form */}
            <form onSubmit={handleMapsSubmit} className="flex gap-2">
              <input
                type="text"
                value={mapsQuery}
                onChange={(e) => setMapsQuery(e.target.value)}
                placeholder={
                  isAr
                    ? 'مثال: أين يقع مركز كبار الممولين بمدينة نصر أو مأمورية ضرائب العاشر من رمضان؟'
                    : 'e.g., Locate the Senior Taxpayer Center (LTC) or district tax office in Cairo...'
                }
                className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
              <button
                type="submit"
                disabled={mapsLoading || !mapsQuery.trim()}
                className="px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-xs flex items-center gap-2 transition-all shadow-lg shadow-emerald-600/30"
              >
                {mapsLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <MapPin className="w-4 h-4" />}
                <span>{isAr ? 'تحديد المواقع' : 'Locate on Map'}</span>
              </button>
            </form>

            {/* Quick Location Shortcuts */}
            <div className="flex flex-wrap gap-2 pt-1">
              <span className="text-xs text-slate-400 self-center">
                {isAr ? 'مقرات حيوية للمحاسبين والمديرين الماليين:' : 'Key Financial Facilities:'}
              </span>
              {[
                {
                  ar: 'موقع مركز كبار الممولين 1 و 2 بمدينة نصر ومأموريات الاستثمار',
                  en: 'Senior Taxpayer Center (مركز كبار الممولين) Cairo'
                },
                {
                  ar: 'المقر الرئيسي للبنك المركزي المصري بشارع الجمهورية وفروعه',
                  en: 'Central Bank of Egypt (CBE) headquarters & treasury branches'
                },
                {
                  ar: 'مكاتب الهيئة العامة للاستثمار والمناطق الحرة (GAFI) ومراكز خدمات المستثمرين',
                  en: 'GAFI Investor Service Centers & Free Zones in Cairo'
                },
                {
                  ar: 'مقرات كبرى شركات التدقيق الدولية (Big 4) بالقاهرة الجديدة والقرية الذكية',
                  en: 'Big 4 Audit & Advisory firms in Smart Village & New Cairo'
                }
              ].map((m, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    const text = isAr ? m.ar : m.en;
                    setMapsQuery(text);
                    handleMapsSubmit(undefined, text);
                  }}
                  className="px-3 py-1.5 rounded-lg bg-slate-950/70 hover:bg-emerald-900/40 border border-slate-800 text-[11px] text-slate-300 hover:text-emerald-300 transition-colors"
                >
                  {isAr ? m.ar : m.en}
                </button>
              ))}
            </div>
          </div>

          {/* Maps Loading State */}
          {mapsLoading && (
            <div className="p-12 text-center rounded-2xl bg-slate-900/60 border border-slate-800">
              <Loader2 className="w-8 h-8 text-emerald-500 animate-spin mx-auto mb-3" />
              <div className="text-sm font-bold text-white">
                {isAr ? 'جاري البحث عبر خرائط Google واستخراج المواقع...' : 'Querying Google Maps Grounding...'}
              </div>
              <div className="text-xs text-slate-400 mt-1 font-mono">gemini-3.8-flash &bull; googleMaps</div>
            </div>
          )}

          {/* Maps Result & URLs Display */}
          {mapsResult && (
            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                  <MapPin className="w-4 h-4" />
                  {isAr ? 'التقرير المكاني وتفاصيل المقرات' : 'Location Grounding Details'}
                </span>
                <span className="text-[11px] font-mono text-slate-400">gemini-3.8-flash</span>
              </div>

              {/* Text Narrative */}
              <div className="text-xs sm:text-sm text-slate-200 whitespace-pre-line leading-relaxed space-y-3 font-sans">
                {mapsResult.text}
              </div>

              {/* CRITICAL SKILL REQUIREMENT: Extract URLs from groundingChunks and list them as links */}
              {mapsResult.places && mapsResult.places.length > 0 && (
                <div className="pt-4 border-t border-slate-800 space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                    <MapPin className="w-4 h-4" />
                    {isAr ? 'روابط المقرات على خرائط Google (Google Maps Links):' : 'Verified Google Maps Place Links:'}
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {mapsResult.places.map((place, pIdx) => (
                      <a
                        key={pIdx}
                        href={place.uri}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-3.5 rounded-xl bg-slate-950 hover:bg-slate-800/80 border border-slate-800 hover:border-emerald-500 transition-all flex items-center justify-between gap-3 group"
                      >
                        <div className="flex items-center gap-3 overflow-hidden">
                          <div className="w-8 h-8 rounded-lg bg-emerald-950/60 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shrink-0">
                            <MapPin className="w-4 h-4" />
                          </div>
                          <div className="overflow-hidden">
                            <div className="text-xs font-bold text-slate-100 group-hover:text-emerald-300 truncate">
                              {place.title}
                            </div>
                            <div className="text-[10px] text-slate-400 font-mono truncate mt-0.5">
                              {place.uri}
                            </div>
                          </div>
                        </div>
                        <ExternalLink className="w-4 h-4 text-slate-500 group-hover:text-emerald-400 shrink-0" />
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

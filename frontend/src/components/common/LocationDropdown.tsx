"use client";

import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";

export const INDIA_STATES = [
  "Andhra Pradesh","Arunachal Pradesh","Assam","Bihar","Chhattisgarh","Goa","Gujarat",
  "Haryana","Himachal Pradesh","Jharkhand","Karnataka","Kerala","Madhya Pradesh",
  "Maharashtra","Manipur","Meghalaya","Mizoram","Nagaland","Odisha","Punjab","Rajasthan",
  "Sikkim","Tamil Nadu","Telangana","Tripura","Uttar Pradesh","Uttarakhand","West Bengal",
  "Delhi","Jammu & Kashmir","Ladakh","Puducherry","Chandigarh",
  "Andaman & Nicobar Islands","Dadra & Nagar Haveli","Daman & Diu","Lakshadweep",
];

export const INDIA_CITIES: Record<string, string[]> = {
  "Andhra Pradesh": ["Visakhapatnam","Vijayawada","Guntur","Nellore","Tirupati","Kurnool","Rajahmundry","Kakinada","Anantapur","Eluru"],
  "Arunachal Pradesh": ["Itanagar","Naharlagun","Pasighat","Tawang","Ziro"],
  "Assam": ["Guwahati","Dibrugarh","Silchar","Jorhat","Nagaon","Tinsukia","Tezpur","Bongaigaon"],
  "Bihar": ["Patna","Gaya","Bhagalpur","Muzaffarpur","Purnia","Darbhanga","Bihar Sharif","Arrah","Begusarai"],
  "Chhattisgarh": ["Raipur","Bhilai","Bilaspur","Korba","Rajnandgaon","Jagdalpur","Ambikapur"],
  "Goa": ["Panaji","Margao","Vasco da Gama","Mapusa","Ponda","Bicholim"],
  "Gujarat": ["Ahmedabad","Surat","Vadodara","Rajkot","Bhavnagar","Jamnagar","Gandhinagar","Junagadh","Anand","Nadiad","Morbi","Mehsana"],
  "Haryana": ["Gurugram","Faridabad","Panipat","Ambala","Hisar","Rohtak","Karnal","Sonipat","Yamunanagar","Panchkula","Bhiwani"],
  "Himachal Pradesh": ["Shimla","Manali","Dharamshala","Solan","Mandi","Kullu","Baddi","Nahan"],
  "Jharkhand": ["Ranchi","Jamshedpur","Dhanbad","Bokaro","Deoghar","Hazaribagh","Giridih"],
  "Karnataka": ["Bengaluru","Mysuru","Mangaluru","Hubballi","Belagavi","Davangere","Ballari","Shivamogga","Tumkur","Vijayapura","Udupi"],
  "Kerala": ["Thiruvananthapuram","Kochi","Kozhikode","Thrissur","Kollam","Alappuzha","Palakkad","Malappuram","Kannur","Kottayam"],
  "Madhya Pradesh": ["Bhopal","Indore","Jabalpur","Gwalior","Ujjain","Sagar","Rewa","Satna","Dewas","Ratlam"],
  "Maharashtra": ["Mumbai","Pune","Nagpur","Nashik","Aurangabad","Solapur","Thane","Kolhapur","Amravati","Nanded","Sangli","Malegaon","Jalgaon"],
  "Manipur": ["Imphal","Thoubal","Churachandpur","Bishnupur"],
  "Meghalaya": ["Shillong","Tura","Jowai","Nongpoh"],
  "Mizoram": ["Aizawl","Lunglei","Champhai","Serchhip"],
  "Nagaland": ["Kohima","Dimapur","Mokokchung","Tuensang"],
  "Odisha": ["Bhubaneswar","Cuttack","Rourkela","Brahmapur","Sambalpur","Puri","Balasore"],
  "Punjab": ["Ludhiana","Amritsar","Jalandhar","Patiala","Bathinda","Mohali","Hoshiarpur","Pathankot","Firozpur"],
  "Rajasthan": ["Jaipur","Jodhpur","Udaipur","Kota","Ajmer","Bikaner","Alwar","Bharatpur","Sikar","Sri Ganganagar"],
  "Sikkim": ["Gangtok","Namchi","Mangan","Gyalshing"],
  "Tamil Nadu": ["Chennai","Coimbatore","Madurai","Tiruchirappalli","Salem","Tirunelveli","Vellore","Erode","Thoothukudi","Tiruppur","Ambattur"],
  "Telangana": ["Hyderabad","Warangal","Nizamabad","Karimnagar","Khammam","Ramagundam","Mahbubnagar"],
  "Tripura": ["Agartala","Udaipur","Dharmanagar","Kailasahar"],
  "Uttar Pradesh": ["Lucknow","Kanpur","Agra","Varanasi","Allahabad","Meerut","Ghaziabad","Noida","Bareilly","Gorakhpur","Moradabad","Aligarh","Mathura","Muzaffarnagar","Saharanpur"],
  "Uttarakhand": ["Dehradun","Haridwar","Roorkee","Haldwani","Rudrapur","Rishikesh","Kashipur"],
  "West Bengal": ["Kolkata","Howrah","Asansol","Siliguri","Durgapur","Bardhaman","Malda","Baharampur","Habra"],
  "Delhi": ["New Delhi","Dwarka","Rohini","Pitampura","Janakpuri","Lajpat Nagar","Saket","Karol Bagh","Connaught Place","Shahdara"],
  "Jammu & Kashmir": ["Srinagar","Jammu","Anantnag","Baramulla","Sopore","Udhampur","Kathua"],
  "Ladakh": ["Leh","Kargil"],
  "Puducherry": ["Puducherry","Karaikal","Mahe","Yanam"],
  "Chandigarh": ["Chandigarh","Manimajra","Panchkula"],
  "Andaman & Nicobar Islands": ["Port Blair","Car Nicobar","Diglipur"],
  "Dadra & Nagar Haveli": ["Silvassa","Amli","Khanvel"],
  "Daman & Diu": ["Daman","Diu"],
  "Lakshadweep": ["Kavaratti","Agatti","Minicoy"],
};

export function getCitiesForState(state: string): string[] {
  if (state && INDIA_CITIES[state]) return INDIA_CITIES[state];
  return Object.values(INDIA_CITIES).flat().sort();
}

interface SearchableDropdownProps {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: string[];
  placeholder: string;
  className?: string;
  required?: boolean;
  error?: string;
}

export function SearchableDropdown({
  label, value, onChange, options, placeholder, className = "", required, error,
}: SearchableDropdownProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [pos, setPos] = useState({ top: 0, left: 0, width: 0 });
  const [mounted, setMounted] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => { setMounted(true); }, []);

  const filtered = options.filter((o) => o.toLowerCase().includes(search.toLowerCase()));

  const updatePos = () => {
    if (wrapperRef.current) {
      const r = wrapperRef.current.getBoundingClientRect();
      setPos({ top: r.bottom + window.scrollY + 4, left: r.left + window.scrollX, width: r.width });
    }
  };

  const openDropdown = () => {
    updatePos();
    setOpen(true);
    setSearch("");
  };

  // Update position on scroll/resize while open
  useEffect(() => {
    if (!open) return;
    const update = () => updatePos();
    window.addEventListener("scroll", update, true);
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update, true);
      window.removeEventListener("resize", update);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const close = () => { setOpen(false); setSearch(""); };

  const dropdownPanel = (
    <>
      <div
        style={{ position: "fixed", inset: 0, zIndex: 9998 }}
        onClick={close}
      />
      <div
        style={{
          position: "absolute",
          top: pos.top,
          left: pos.left,
          width: pos.width,
          zIndex: 9999,
        }}
        className="bg-white border border-gray-200 rounded-xl shadow-2xl overflow-hidden"
      >
        {/* Search */}
        <div className="p-2.5 border-b border-gray-100 bg-gray-50">
          <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-3 py-2 focus-within:border-blue-400 focus-within:ring-1 focus-within:ring-blue-100">
            <svg className="w-4 h-4 text-gray-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
            </svg>
            <input
              autoFocus
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={`Search ${label}…`}
              className="flex-1 text-sm outline-none bg-transparent text-gray-800 placeholder-gray-400"
            />
            {search && (
              <button type="button" onClick={() => setSearch("")} className="text-gray-300 hover:text-gray-500">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        </div>
        {/* List */}
        <ul className="max-h-56 overflow-y-auto py-1">
          {filtered.length === 0 ? (
            <li className="px-4 py-4 text-sm text-gray-400 text-center">No results for &quot;{search}&quot;</li>
          ) : filtered.map((opt) => (
            <li key={opt}>
              <button
                type="button"
                onMouseDown={(e) => { e.preventDefault(); onChange(opt); close(); }}
                className={`w-full text-left px-4 py-2.5 text-sm flex items-center justify-between transition-colors
                  ${value === opt ? "bg-blue-50 text-blue-700 font-semibold" : "text-gray-700 hover:bg-gray-50"}`}
              >
                <span>{opt}</span>
                {value === opt && <span className="text-blue-500 text-xs font-bold">✓</span>}
              </button>
            </li>
          ))}
        </ul>
        <div className="px-4 py-1.5 border-t border-gray-100 bg-gray-50 text-xs text-gray-400">
          {filtered.length} result{filtered.length !== 1 ? "s" : ""}
        </div>
      </div>
    </>
  );

  return (
    <div ref={wrapperRef} className={className}>
      {label && (
        <label className="block text-sm font-semibold text-gray-700 mb-1.5">
          {label}{required && <span className="text-red-500 ml-0.5">*</span>}
        </label>
      )}
      <button
        type="button"
        onClick={openDropdown}
        className={`w-full border rounded-xl px-3 py-2.5 text-sm text-left flex items-center justify-between gap-2 outline-none transition-all cursor-pointer bg-white
          ${error ? "border-red-400" : "border-gray-200 hover:border-gray-300"}
          ${open ? "border-blue-400 ring-2 ring-blue-100" : ""}`}
      >
        <span className={`truncate ${value ? "text-gray-900" : "text-gray-400"}`}>{value || placeholder}</span>
        <svg className={`w-4 h-4 text-gray-400 shrink-0 transition-transform duration-200 ${open ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}

      {open && mounted && createPortal(dropdownPanel, document.body)}
    </div>
  );
}

// Convenience wrappers
export function StateDropdown({ value, onChange, label = "State", required, error, className }: {
  value: string; onChange: (v: string) => void; label?: string; required?: boolean; error?: string; className?: string;
}) {
  return (
    <SearchableDropdown
      label={label} value={value} onChange={onChange}
      options={INDIA_STATES} placeholder="Select state"
      required={required} error={error} className={className}
    />
  );
}

export function CityDropdown({ value, onChange, state, label = "City", required, error, className }: {
  value: string; onChange: (v: string) => void; state?: string; label?: string; required?: boolean; error?: string; className?: string;
}) {
  return (
    <SearchableDropdown
      label={label} value={value} onChange={onChange}
      options={getCitiesForState(state || "")} placeholder="Select city"
      required={required} error={error} className={className}
    />
  );
}

import { useEffect, useState, useRef } from "react";
import {
  ArrowDownWideNarrow,
  ArrowUpWideNarrow,
  ChevronDown,
  Calendar,
  Briefcase,
  Building2,
  Telescope,
  RefreshCcw,
  Search,
  FlaskConical,
  Filter,
} from "lucide-react";
import {
  getBdNames,
  getClientNames,
  getVerticals,
  getLabNames,
} from "../services/api.js";

const CustomSelect = ({
  options,
  selected,
  onToggle,
  onSearchChange,
  searchTerm,
  label,
  icon,
  isExcluded = false,
  // ADDED: New disabled prop
  disabled = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, []);

  const handleToggle = (option) => {
    if (disabled) return; // Prevent toggle if disabled
    onToggle(option);
  };

  const isSelected = (option) => selected.includes(option);

  return (
    <div className="relative w-full" ref={dropdownRef}>
      <button
        type="button"
        className={`w-full flex justify-between items-center bg-white border border-gray-200 rounded-xl shadow-sm px-4 py-3 text-left transition-all duration-200 focus:outline-none group
        ${
          disabled
            ? "bg-gray-100 cursor-not-allowed text-gray-400 border-gray-300"
            : "hover:border-blue-400 hover:shadow-md focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
        }
        `}
        onClick={() => !disabled && setIsOpen(!isOpen)} // Only open if not disabled
        disabled={disabled}
      >
        <div className="flex items-center gap-2.5">
          {icon}
          <span className="text-sm font-medium text-gray-700">{label}</span>
        </div>
        <ChevronDown
          className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {isOpen && !disabled && (
        <div className="absolute top-full left-0 z-50 w-full mt-2 bg-white border border-gray-100 rounded-xl shadow-xl animate-fade-in-down max-h-64 overflow-hidden">
          <div className="p-3 border-b border-gray-200 bg-gray-50 sticky top-0 z-10">
            <div className="relative">
              <input
                type="text"
                className="w-full pl-10 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 bg-white"
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => onSearchChange(e.target.value)}
              />
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            </div>
          </div>
          <ul className="py-1 overflow-y-auto max-h-52 custom-scrollbar">
            {options.length > 0 ? (
              options.map((option) => (
                <li
                  key={option}
                  className="py-2.5 px-4 cursor-pointer text-sm font-medium hover:bg-blue-50 transition-colors duration-150"
                  onClick={() => handleToggle(option)}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={
                        isSelected(option)
                          ? isExcluded
                            ? "font-bold text-red-600"
                            : "font-bold text-blue-600"
                          : "text-gray-800"
                      }
                    >
                      {option}
                    </span>
                    {isSelected(option) && (
                      <svg
                        className="w-4 h-4 text-blue-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M5 13l4 4L19 7"
                        ></path>
                      </svg>
                    )}
                  </div>
                </li>
              ))
            ) : (
              <li className="py-3 px-4 text-sm text-gray-500 text-center italic">
                No options found
              </li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
};

const ExcludeToggle = ({ enabled, onChange, disabled = false }) => {
  const handleClick = () => {
    if (disabled) return; // Prevent click if disabled
    const nextVal = !enabled;
    onChange(nextVal);
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-pressed={enabled}
      disabled={disabled}
      className={`relative inline-flex items-center h-6 w-12 rounded-full transition-all duration-300 transform-gpu shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 ${
        disabled
          ? "bg-gray-400 cursor-not-allowed opacity-70"
          : enabled
          ? "bg-gradient-to-r from-red-500 to-red-600 focus:ring-red-500"
          : "bg-gradient-to-r from-blue-500 to-cyan-600 focus:ring-blue-500"
      }`}
    >
      <span className="sr-only">Toggle include/exclude</span>
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-300 shadow-sm ${
          enabled ? "translate-x-6" : "translate-x-1"
        }`}
      />
      <span
        className={`absolute right-1.5 text-white text-[9px] font-bold transition-opacity duration-300 ${
          enabled ? "opacity-100" : "opacity-0"
        }`}
      >
        EX
      </span>
      <span
        className={`absolute left-1.5 text-white text-[9px] font-bold transition-opacity duration-300 ${
          enabled ? "opacity-0" : "opacity-100"
        }`}
      >
        IN
      </span>
    </button>
  );
};

export default function Filters({ onChange, onResetAll, disabled, queryType }) {
  const today = new Date();

  console.log('queryType', queryType)

  const allDataRangeStart = new Date(2025, 3, 1).toISOString().split("T")[0];
  const defaultToDate = today.toISOString().split("T")[0];

  const defaultRange = {
    start: today.toISOString().split("T")[0],
    end: defaultToDate,
  };
  const defaultMonth = (today.getMonth() + 1).toString();
  const defaultYear = today.getFullYear().toString();

  const [filterType, setFilterType] = useState("range");
  const [range, setRange] = useState(defaultRange);
  const [month, setMonth] = useState(defaultMonth);
  const [year, setYear] = useState(defaultYear);
  const [verticals, setVerticals] = useState([]);
  const [bdNames, setBdNames] = useState([]);
  const [clientNames, setClientNames] = useState([]);
  const [sortOrder, setSortOrder] = useState("newest");
  const [sortOpen, setSortOpen] = useState(false);
  const [dateField, setDateField] = useState(queryType);
  const [labNames, setLabNames] = useState([]);

  const [excludeVerticals, setExcludeVerticals] = useState(false);
  const [excludeBds, setExcludeBds] = useState(false);
  const [excludeClients, setExcludeClients] = useState(false);
  const [excludeLabs, setExcludeLabs] = useState(false);

  // ADDED: State for disabling the BD dropdown
  const [isBdDisabled, setIsBdDisabled] = useState(false);

  const [verticalSearchTerm, setVerticalSearchTerm] = useState("");
  const [bdSearchTerm, setBdSearchTerm] = useState("");
  const [clientSearchTerm, setClientSearchTerm] = useState("");
  const [labSearchTerm, setLabSearchTerm] = useState("");

  const [verticalOptions, setVerticalOptions] = useState([]);
  const [bdOptions, setBdOptions] = useState([]);
  const [clientOptions, setClientOptions] = useState([]);
  const [labOptions, setLabOptions] = useState([]);
  const [loadingOptions, setLoadingOptions] = useState(false);

  const isLabAnalysisView = queryType === "labAnalysis";

  const buildSearchRequest = (nextState = {}) => {
    const base = {
      dateField: nextState.dateField ?? dateField,
      bdNames: isLabAnalysisView ? [] : nextState.bdNames ?? bdNames,
      clientNames: isLabAnalysisView
        ? []
        : nextState.clientNames ?? clientNames,
      verticals: isLabAnalysisView ? [] : nextState.verticals ?? verticals,
      labNames: !isLabAnalysisView ? [] : nextState.labNames ?? labNames,
      excludeBds: isLabAnalysisView
        ? false
        : nextState.excludeBds ?? excludeBds,
      excludeClients: isLabAnalysisView
        ? false
        : nextState.excludeClients ?? excludeClients,
      excludeVerticals: isLabAnalysisView
        ? false
        : nextState.excludeVerticals ?? excludeVerticals,
      excludeLabs: !isLabAnalysisView
        ? false
        : nextState.excludeLabs ?? excludeLabs,
    };

    const nextFilterType = nextState.filterType ?? filterType;

    if (nextFilterType === "all") {
      return {
        ...base,
        filterType: "all",
        fromDate: allDataRangeStart,
        toDate: defaultToDate,
      };
    }

    if (nextFilterType === "range") {
      const nextRange = nextState.range ?? range;
      if (nextRange.start && nextRange.end) {
        return {
          ...base,
          filterType: "range",
          fromDate: nextRange.start,
          toDate: nextRange.end,
        };
      }
    }

    if (nextFilterType === "month") {
      const nextMonth = nextState.month ?? month;
      const nextYear = nextState.year ?? year;
      const req = { ...base, filterType: "month", year: Number(nextYear) };
      if (nextMonth) req.month = Number(nextMonth);
      return req;
    }

    return base;
  };

  const emit = (next = {}) => {
    const isLab = next.queryType === "labAnalysis" || isLabAnalysisView;
    const nextFilterType = next.filterType ?? filterType;

    const payload = {
      filterType: nextFilterType,
      range,
      month,
      year,
      verticals: isLab ? [] : verticals,
      bdNames: isLab ? [] : bdNames,
      clientNames: isLab ? [] : clientNames,
      labNames: isLab ? labNames : [],
      sortOrder,
      dateField,
      excludeVerticals: isLab ? false : excludeVerticals,
      excludeBds: isLab ? false : excludeBds,
      excludeClients: isLab ? false : excludeClients,
      excludeLabs: isLab ? excludeLabs : false,
      ...next,
    };
    onChange?.(payload);
  };

  const handleSort = (order) => {
    setSortOrder(order);
    setSortOpen(false);
    emit({ sortOrder: order });
  };

  const handleReset = () => {
    // Standard resets for all other fields
    setFilterType("range");
    setRange(defaultRange);
    setMonth(defaultMonth);
    setYear(defaultYear);
    setVerticals([]);
    setClientNames([]);
    setSortOrder("newest");
    setDateField("inqDate");
    setExcludeVerticals(false);
    setExcludeClients(false);
    setLabNames([]);
    setExcludeLabs(false);
    
    const storedBdCode = localStorage.getItem("BdCode");
    const isBdLockedLocal = storedBdCode && storedBdCode.trim() !== "";

    // START: Logic to preserve BD Name and Exclude State if locked
    if (!isBdLockedLocal) {
        setBdNames([]);
        setExcludeBds(false);
        setIsBdDisabled(false); 
    }
    // END: Logic to preserve BD Name and Exclude State if locked

    onResetAll?.();

    // Emit the new filter state, using the possibly preserved bdNames/excludeBds state
    emit({
      filterType: "range",
      range: defaultRange,
      month: defaultMonth,
      year: defaultYear,
      // If locked, bdNames and excludeBds retain their values from state.
      bdNames: isBdLockedLocal ? bdNames : [], 
      excludeBds: isBdLockedLocal ? false : false, // Exclude must be false when locked, and false when reset.
      clientNames: [],
      verticals: [],
      labStatusFilter: null,
      sortOrder: "newest",
      dateField: "inqDate",
      excludeVerticals: false,
      excludeClients: false,
      labNames: [],
      excludeLabs: false,
    });
  };

  const useDebouncedEffect = (effect, deps, delay) => {
    useEffect(() => {
      const handler = setTimeout(() => effect(), delay);
      return () => clearTimeout(handler);
    }, [...deps, delay]);
  };

  const optionsDeps = [
    filterType,
    range.start,
    range.end,
    month,
    year,
    dateField,
    excludeBds,
    excludeClients,
    excludeVerticals,
    excludeLabs,
    isLabAnalysisView,
  ];

  useDebouncedEffect(
    () => {
      if (isLabAnalysisView) {
        setVerticalOptions([]);
        return;
      }
      const controller = new AbortController();
      const fetchVerticals = async () => {
        setLoadingOptions(true);
        try {
          const body = buildSearchRequest();
          const options = await getVerticals(body, {
            signal: controller.signal,
          });
          setVerticalOptions(Array.isArray(options) ? options : []);
        } catch (e) {
          if (e.name !== "AbortError")
            console.error("Failed to fetch verticals: ", e);
          setVerticalOptions([]);
        } finally {
          setLoadingOptions(false);
        }
      };
      fetchVerticals();
      return () => controller.abort();
    },
    optionsDeps,
    400
  );

useDebouncedEffect(
  () => {
    const storedBdCode = localStorage.getItem("BdCode");

    // ✅ If Lab Analysis View, skip fetching
    if (isLabAnalysisView) {
      setBdOptions([]);
      setIsBdDisabled(false); 
      return;
    }

    // Check for BdCode and lock the dropdown if present
    if (storedBdCode && storedBdCode.trim() !== "") {
      setIsBdDisabled(true); // Disable BD dropdown
      setExcludeBds(false); // Force include mode when locked
      
      const controller = new AbortController();

      const fetchSingleBd = async () => {
        setLoadingOptions(true);
        try {
          // Fetch ALL BD names/codes to find the match, ignoring current filters
          // to ensure the locked BD name is always available.
          const response = await getBdNames({ dateField: queryType }, { signal: controller.signal });

          // Find the BD record matching this BdCode
          const matched = response.find(
            (r) => String(r.bdCode) === String(storedBdCode)
          );

          if (matched) {
            const bdName = matched.bdName;
            setBdOptions([bdName]); // only show this one
            
            // Auto-select the BD name and emit the change
            setBdNames([bdName]);
            emit({ bdNames: [bdName], excludeBds: false });
            
          } else {
            // Fallback if no match found but code exists: keep disabled but show empty
            setBdOptions([]);
            setBdNames([]);
            emit({ bdNames: [], excludeBds: false });
          }
        } catch (e) {
          if (e.name !== "AbortError")
            console.error("Failed to fetch BD names", e);
          setBdOptions([]);
        } finally {
          setLoadingOptions(false);
        }
      };

      fetchSingleBd();
      return () => controller.abort();
    }

    // ✅ Normal flow if BdCode is NOT present or empty
    setIsBdDisabled(false); // Enable BD dropdown
    const controller = new AbortController();
    const fetchBDs = async () => {
      setLoadingOptions(true);
      try {
        const body = buildSearchRequest();
        const response = await getBdNames(body, { signal: controller.signal });

        const options = response.map((r) => r.bdName);
        setBdOptions(Array.isArray(options) ? options : []);
      } catch (e) {
        if (e.name !== "AbortError")
          console.error("Failed to fetch BD names", e);
        setBdOptions([]);
      } finally {
        setLoadingOptions(false);
      }
    };

    fetchBDs();
    return () => controller.abort();
  },
  optionsDeps,
  400
);


  useDebouncedEffect(
    () => {
      if (isLabAnalysisView) {
        setClientOptions([]);
        return;
      }
      const controller = new AbortController();
      const fetchClients = async () => {
        setLoadingOptions(true);
        try {
          const body = buildSearchRequest();
          const response = await getClientNames(body, {
            signal: controller.signal,
          });

          var options = response.map(r => r.clientName);

          setClientOptions(Array.isArray(options) ? options : []);
        } catch (e) {
          if (e.name !== "AbortError")
            console.error("Failed to fetch Client names", e);
          setClientOptions([]);
        } finally {
          setLoadingOptions(false);
        }
      };
      fetchClients();
      return () => controller.abort();
    },
    optionsDeps,
    400
  );

  useDebouncedEffect(
    () => {
      if (!isLabAnalysisView) {
        setLabOptions([]);
        return;
      }
      const controller = new AbortController();
      const fetchLabNames = async () => {
        setLoadingOptions(true);
        try {
          const body = buildSearchRequest();
          const options = await getLabNames(body, {
            signal: controller.signal,
          });
          setLabOptions(Array.isArray(options) ? options : []);
        } catch (e) {
          if (e.name !== "AbortError")
            console.error("Failed to fetch lab names: ", e);
          setLabOptions([]);
        } finally {
          setLoadingOptions(false);
        }
      };
      fetchLabNames();
      return () => controller.abort();
    },
    optionsDeps,
    400
  );

  const filteredVerticalOptions = verticalOptions.filter((v) =>
    v.toLowerCase().includes(verticalSearchTerm.toLowerCase())
  );
  const filteredBdOptions = bdOptions.filter((bd) =>
    bd.toLowerCase().includes(bdSearchTerm.toLowerCase())
  );
  const filteredClientOptions = clientOptions.filter((c) =>
    c.toLowerCase().includes(clientSearchTerm.toLowerCase())
  );
  const filteredLabOptions = labOptions.filter((c) =>
    c.toLowerCase().includes(labSearchTerm.toLowerCase())
  );

  return (
    <>
      <style>{style}</style>
      <fieldset
        disabled={disabled}
        className={`relative transition-all duration-300 font-inter space-y-6 mb-8 ${
          disabled ? "opacity-50 pointer-events-none" : ""
        }`}
      >
        {/* MAIN FILTER CARD */}
        <div className="bg-white shadow-lg rounded-2xl p-6 border border-gray-100">
          {/* Header with Icon */}
          <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-100">
            <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-600 shadow-md">
              <Filter className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">
                Search Filters
              </h2>
              <p className="text-xs text-gray-500">
                Customize your search criteria
              </p>
            </div>
          </div>

          {/* Main filter controls container */}
          <div className="flex flex-col lg:flex-row items-start lg:items-end justify-between gap-6">
            {/* Left side: Filter Type + Date/Month Inputs */}
            <div className="flex flex-col sm:flex-row items-start sm:items-end gap-4 w-full lg:w-auto">
              {/* Filter Type Tabs */}
              <div className="flex gap-1.5 bg-gray-100 rounded-xl p-1.5 shadow-inner border border-gray-200 flex-shrink-0">
                {["all", "range", "month"].map((ft) => (
                  <button
                    key={ft}
                    onClick={() => {
                      setFilterType(ft);
                      emit({ filterType: ft });
                    }}
                    className={`px-4 py-2 text-sm font-semibold rounded-lg transition-all duration-300 transform hover:scale-105 active:scale-100 ${
                      filterType === ft
                        ? "bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-lg"
                        : "bg-white text-gray-700 hover:bg-gray-50 hover:text-blue-600"
                    }`}
                  >
                    {ft === "all"
                      ? "All Data"
                      : ft === "range"
                      ? "Date Range"
                      : "Month & Year"}
                  </button>
                ))}
              </div>

              {/* Date/Month/Year Selectors */}
              {(filterType === "range" || filterType === "month") && (
                <div className="flex gap-3 w-full sm:w-auto">
                  {filterType === "range" && (
                    <>
                      <div>
                        <label className="text-xs font-medium text-gray-600 block mb-2 flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-blue-600" />
                          Start Date
                        </label>
                        <div className="flex-1 sm:w-40 flex items-center bg-white border border-gray-200 rounded-xl shadow-sm px-3 py-2.5 hover:border-blue-400 hover:shadow-md transition-all">
                          <input
                            type="date"
                            value={range.start}
                            onChange={(e) => {
                              const next = { ...range, start: e.target.value };
                              setRange(next);
                              emit({ range: next });
                            }}
                            className="bg-transparent outline-none text-sm w-full text-gray-800 font-medium"
                            placeholder="Start Date"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="text-xs font-medium text-gray-600 block mb-2 flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-blue-600" />
                          End Date
                        </label>
                        <div className="flex-1 sm:w-40 flex items-center bg-white border border-gray-200 rounded-xl shadow-sm px-3 py-2.5 hover:border-blue-400 hover:shadow-md transition-all">
                          <input
                            type="date"
                            value={range.end}
                            onChange={(e) => {
                              const next = { ...range, end: e.target.value };
                              setRange(next);
                              emit({ range: next });
                            }}
                            className="bg-transparent outline-none text-sm w-full text-gray-800 font-medium"
                            placeholder="End Date"
                          />
                        </div>
                      </div>
                    </>
                  )}

                  {filterType === "month" && (
                    <>
                      <div className="flex-1 sm:w-40 flex items-center bg-white border border-gray-200 rounded-xl shadow-sm px-3 py-2.5 hover:border-blue-400 hover:shadow-md transition-all">
                        <Calendar className="w-4 h-4 text-blue-600 mr-2 flex-shrink-0" />
                        <select
                          value={month}
                          onChange={(e) => {
                            setMonth(e.target.value);
                            emit({ month: e.target.value });
                          }}
                          className="bg-transparent outline-none text-sm w-full text-gray-800 font-medium appearance-none pr-6"
                        >
                          {Array.from({ length: 12 }, (_, i) => (
                            <option key={i + 1} value={i + 1}>
                              {new Date(0, i).toLocaleString("default", {
                                month: "long",
                              })}
                            </option>
                          ))}
                        </select>
                        <ChevronDown className="w-4 h-4 text-gray-500 ml-auto pointer-events-none flex-shrink-0" />
                      </div>

                      <div className="flex-1 sm:w-32 flex items-center bg-white border border-gray-200 rounded-xl shadow-sm px-3 py-2.5 hover:border-blue-400 hover:shadow-md transition-all">
                        <Calendar className="w-4 h-4 text-blue-600 mr-2 flex-shrink-0" />
                        <input
                          type="number"
                          placeholder="Year"
                          value={year}
                          onChange={(e) => {
                            const currentYear = new Date().getFullYear();
                            const val = e.target.value;
                            if (val <= currentYear) {
                              setYear(val);
                              emit({ year: val });
                            }
                          }}
                          className="bg-transparent outline-none text-sm w-full text-gray-800 font-medium"
                          max={new Date().getFullYear()}
                        />
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Right side: Sort and Reset */}
            <div className="flex items-center gap-3 flex-shrink-0">
              {!isLabAnalysisView && (
                <div className="relative">
                  <button
                    onClick={() => setSortOpen(!sortOpen)}
                    className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 rounded-xl shadow-sm text-gray-700 hover:border-blue-400 hover:bg-gray-50 transition-all duration-200"
                  >
                    {sortOrder === "newest" ? (
                      <ArrowDownWideNarrow className="w-4 h-4 text-blue-600" />
                    ) : (
                      <ArrowUpWideNarrow className="w-4 h-4 text-blue-600" />
                    )}
                    <span className="text-sm font-medium hidden sm:inline">
                      {sortOrder === "newest" ? "Newest" : "Oldest"}
                    </span>
                    <ChevronDown
                      className={`w-4 h-4 text-gray-500 transition-transform duration-200 ${
                        sortOpen ? "rotate-180" : ""
                      }`}
                    />
                  </button>

                  {sortOpen && (
                    <div className="absolute mt-2 right-0 bg-white border border-gray-100 shadow-xl rounded-xl w-44 overflow-hidden z-20 animate-fade-in-down">
                      <button
                        onClick={() => handleSort("newest")}
                        className={`flex items-center gap-2 px-4 py-2.5 w-full text-left text-sm transition-colors duration-150 ${
                          sortOrder === "newest"
                            ? "bg-blue-50 font-semibold text-blue-700"
                            : "text-gray-700 hover:bg-gray-50"
                        }`}
                      >
                        <ArrowDownWideNarrow className="w-4 h-4" /> Newest First
                      </button>
                      <button
                        onClick={() => handleSort("oldest")}
                        className={`flex items-center gap-2 px-4 py-2.5 w-full text-left text-sm transition-colors duration-150 ${
                          sortOrder === "oldest"
                            ? "bg-blue-50 font-semibold text-blue-700"
                            : "text-gray-700 hover:bg-gray-50"
                        }`}
                      >
                        <ArrowUpWideNarrow className="w-4 h-4" /> Oldest First
                      </button>
                    </div>
                  )}
                </div>
              )}

              <button
                onClick={handleReset}
                className="flex items-center gap-2 text-sm px-4 py-2.5 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-xl shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 transition-all duration-300"
              >
                <RefreshCcw className="w-4 h-4" />
                <span className="hidden sm:inline">Reset</span>
              </button>
            </div>
          </div>
        </div>

        {/* SPECIFIC FILTERS CARD */}
        <div className="bg-white shadow-lg rounded-2xl p-6 border border-gray-100">
          <div
            className={`grid grid-cols-1 md:grid-cols-2 ${
              isLabAnalysisView ? "lg:grid-cols-4" : "lg:grid-cols-3"
            } gap-6`}
          >
            {isLabAnalysisView && (
              <>
                <div className="flex flex-col">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-xs font-semibold text-gray-600 flex items-center gap-2">
                      <FlaskConical className="w-3.5 h-3.5 text-blue-600" />
                      <span>Labs</span>
                      {loadingOptions && (
                        <div className="animate-spin rounded-full h-3.5 w-3.5 border-2 border-blue-600 border-t-transparent"></div>
                      )}
                    </span>
                    <ExcludeToggle
                      enabled={excludeLabs}
                      onChange={(val) => {
                        setExcludeLabs(val);
                        emit({ excludeLabs: val });
                      }}
                    />
                  </div>
                  <CustomSelect
                    label={`${
                      labNames.length === 0
                        ? "Select Labs"
                        : `${labNames.length} selected`
                    }`}
                    icon={<FlaskConical className="w-4 h-4 text-blue-600" />}
                    options={filteredLabOptions}
                    selected={labNames}
                    onToggle={(option) => {
                      const updated = labNames.includes(option)
                        ? labNames.filter((n) => n !== option)
                        : [...labNames, option];
                      setLabNames(updated);
                      emit({ labNames: updated });
                    }}
                    searchTerm={labSearchTerm}
                    onSearchChange={setLabSearchTerm}
                    isExcluded={excludeLabs}
                  />
                </div>

                <div className="lg:col-span-2 hidden lg:block"></div>
              </>
            )}

            {!isLabAnalysisView && (
              <>
                <div className="flex flex-col">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-xs font-semibold text-gray-600 flex items-center gap-2">
                      <Telescope className="w-3.5 h-3.5 text-blue-600" />
                      <span>Verticals</span>
                      {loadingOptions && (
                        <div className="animate-spin rounded-full h-3.5 w-3.5 border-2 border-blue-600 border-t-transparent"></div>
                      )}
                    </span>
                    <ExcludeToggle
                      enabled={excludeVerticals}
                      onChange={(val) => {
                        setExcludeVerticals(val);
                        emit({ excludeVerticals: val });
                      }}
                    />
                  </div>
                  <CustomSelect
                    label={`${
                      verticals.length === 0
                        ? "Select Verticals"
                        : `${verticals.length} selected`
                    }`}
                    icon={<Telescope className="w-4 h-4 text-blue-600" />}
                    options={filteredVerticalOptions}
                    selected={verticals}
                    onToggle={(option) => {
                      const updated = verticals.includes(option)
                        ? verticals.filter((n) => n !== option)
                        : [...verticals, option];
                      setVerticals(updated);
                      emit({ verticals: updated });
                    }}
                    searchTerm={verticalSearchTerm}
                    onSearchChange={setVerticalSearchTerm}
                    isExcluded={excludeVerticals}
                  />
                </div>

                <div className="flex flex-col">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-xs font-semibold text-gray-600 flex items-center gap-2">
                      <Briefcase className="w-3.5 h-3.5 text-blue-600" />
                      <span>BD Names</span>
                      {loadingOptions && (
                        <div className="animate-spin rounded-full h-3.5 w-3.5 border-2 border-blue-600 border-t-transparent"></div>
                      )}
                    </span>
                    {/* Disable ExcludeToggle if BD is disabled/locked */}
                    <ExcludeToggle
                      enabled={excludeBds}
                      onChange={(val) => {
                        setExcludeBds(val);
                        emit({ excludeBds: val });
                      }}
                      disabled={isBdDisabled} // Added disabled prop
                    />
                  </div>
                  <CustomSelect
                    label={`${
                      bdNames.length === 0
                        ? "Select BDs"
                        : isBdDisabled
                        ? bdNames[0] // Show the single selected BD name when disabled
                        : `${bdNames.length} selected`
                    }`}
                    icon={<Briefcase className="w-4 h-4 text-blue-600" />}
                    options={filteredBdOptions}
                    selected={bdNames}
                    onToggle={(option) => {
                      const updated = bdNames.includes(option)
                        ? bdNames.filter((n) => n !== option)
                        : [...bdNames, option];
                      setBdNames(updated);
                      emit({ bdNames: updated });
                    }}
                    searchTerm={bdSearchTerm}
                    onSearchChange={setBdSearchTerm}
                    isExcluded={excludeBds}
                    disabled={isBdDisabled} // Added disabled prop
                  />
                </div>

                <div className="flex flex-col">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-xs font-semibold text-gray-600 flex items-center gap-2">
                      <Building2 className="w-3.5 h-3.5 text-blue-600" />
                      <span>Client Names</span>
                      {loadingOptions && (
                        <div className="animate-spin rounded-full h-3.5 w-3.5 border-2 border-blue-600 border-t-transparent"></div>
                      )}
                    </span>
                    <ExcludeToggle
                      enabled={excludeClients}
                      onChange={(val) => {
                        setExcludeClients(val);
                        emit({ excludeClients: val });
                      }}
                    />
                  </div>
                  <CustomSelect
                    label={`${
                      clientNames.length === 0
                        ? "Select Clients"
                        : `${clientNames.length} selected`
                    }`}
                    icon={<Building2 className="w-4 h-4 text-blue-600" />}
                    options={filteredClientOptions}
                    selected={clientNames}
                    onToggle={(option) => {
                      const updated = clientNames.includes(option)
                        ? clientNames.filter((n) => n !== option)
                        : [...clientNames, option];
                      setClientNames(updated);
                      emit({ clientNames: updated });
                    }}
                    searchTerm={clientSearchTerm}
                    onSearchChange={setClientSearchTerm}
                    isExcluded={excludeClients}
                  />
                </div>
              </>
            )}
          </div>
        </div>
      </fieldset>
    </>
  );
}

const style = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
  
  @keyframes fade-in-down {
    0% {
      opacity: 0;
      transform: translateY(-10px);
    }
    100% {
      opacity: 1;
      transform: translateY(0);
    }
  }

  .animate-fade-in-down {
    animation: fade-in-down 0.2s ease-out;
  }

  @keyframes fade-in-up {
    0% {
      opacity: 0;
      transform: translateY(10px);
    }
    100% {
      opacity: 1;
      transform: translateY(0);
    }
  }

  .animate-fade-in-up {
    animation: fade-in-up 0.2s ease-out;
  }

  .font-inter {
    font-family: 'Inter', sans-serif;
  }

  /* Custom scrollbar for dropdowns */
  .custom-scrollbar::-webkit-scrollbar {
    width: 6px;
  }

  .custom-scrollbar::-webkit-scrollbar-track {
    background: #f1f5f9;
    border-radius: 3px;
  }

  .custom-scrollbar::-webkit-scrollbar-thumb {
    background: #60a5fa;
    border-radius: 3px;
  }

  .custom-scrollbar::-webkit-scrollbar-thumb:hover {
    background: #3b82f6;
  }
`;
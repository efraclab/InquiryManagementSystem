import React, { useState, useMemo, useCallback, useEffect } from "react";
import {
  Calendar,
  Search,
  RefreshCcw,
  Filter,
  Clock,
  FlaskConical,
  ChevronDown,
  AlertCircle,
  CheckCircle,
  XCircle,
  Loader2,
  Microscope,
  TestTube2,
  ListFilter,
  User,
  Hash,
  ChevronRight,
  FileText,
  Beaker,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

import {
  getLabNames,
  getPendingParametersQA,
  getPendingParametersOverviewQA,
} from "../services/api";
import { FaMagnifyingGlass } from "react-icons/fa6";


function getISODateTime(dateString, type) {
  if (!dateString) return undefined;
  
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return undefined;

  let year = date.getFullYear();
  let month = (date.getMonth() + 1).toString().padStart(2, '0');
  let day = date.getDate().toString().padStart(2, '0');
  
  if (type === 'start') {
    return `${year}-${month}-${day}T00:00:00.000`;
  } else if (type === 'end') {
    return `${year}-${month}-${day}T23:59:59.999`;
  }
  return undefined;
}


function parseDate(dateString) {
  if (!dateString) return null;
  const parts = dateString.split(" ");
  const dateParts = parts[0].split("T")[0].split("-");

  if (dateParts.length === 3) {
      return new Date(dateParts[0], dateParts[1] - 1, dateParts[2]);
  }
  
  const partsCustom = dateString.split(" ");
  const datePartsCustom = partsCustom[0].split("/");
  if (datePartsCustom.length === 3) {
    return new Date(datePartsCustom[2], datePartsCustom[1] - 1, datePartsCustom[0]);
  }
  
  return new Date(dateString);
}

function formatDate(dateString) {
  if (!dateString) return "-";
  try {
    const date = parseDate(dateString);
    if (!date || isNaN(date.getTime())) return dateString;
    return date.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch (e) {
    return dateString;
  }
}

// --- Aggregate parameters by registration number ---
function aggregateByRegistration(parameters) {
  const grouped = {};
  
  parameters.forEach(param => {
    const regNo = param.registrationNo;
    if (!grouped[regNo]) {
      grouped[regNo] = {
        registrationNo: regNo,
        sampleName: param.sampleName,
        registrationDate: param.registrationDate,
        analysisCompletionDateTime: param.analysisCompletionDateTime,
        tatDate: param.tatDate,
        parameters: []
      };
    }
    grouped[regNo].parameters.push({
      name: param.parameter,
      sampleName: param.sampleName
    });
  });
  
  return Object.values(grouped);
}

// --- Reusable UI Components ---

const MultiSelectDropdown = ({
  options,
  selected,
  onToggle,
  label,
  icon: Icon,
  onSelectAll,
  onDeselectAll,
  disabled = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const dropdownRef = React.useRef(null);

  const filteredOptions = options.filter((option) =>
    option.label.toLowerCase().includes(searchTerm.toLowerCase())
  );

  React.useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const count = selected.length;
  const displayValue =
    count === 0
      ? `Select ${label}`
      : count === options.length
      ? `All ${label}`
      : `${count} ${label} Selected`;

  const handleItemToggle = (value) => {
    const updatedSelection = selected.includes(value)
      ? selected.filter((v) => v !== value)
      : [...selected, value];
    onToggle(updatedSelection);
  };

  return (
    <div className="relative w-full" ref={dropdownRef}>
      <button
        type="button"
        className={`w-full bg-white border border-gray-200 rounded-xl shadow-sm px-4 py-3 text-left transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-blue-500 text-sm font-medium flex items-center justify-between group cursor-pointer
          ${disabled ? "opacity-60 cursor-not-allowed" : "hover:shadow-md"}`}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
      >
        <span className="flex items-center gap-2.5">
          <Icon className="w-4 h-4 text-blue-600 group-hover:text-blue-700" />
          <span className="text-gray-700">{displayValue}</span>
        </span>
        <ChevronDown
          className={`w-4 h-4 text-gray-400 transform transition-transform duration-200 ${
            isOpen ? "rotate-180" : "rotate-0"
          }`}
        />
      </button>

      {isOpen && !disabled && (
        <div className="absolute z-10 mt-2 w-full rounded-xl bg-white shadow-xl ring-1 ring-gray-200 overflow-hidden border border-gray-100">
          <div className="p-3 border-b border-gray-100 bg-gray-50">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder={`Search ${label}...`}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 bg-white"
              />
            </div>
          </div>
          <ul className="max-h-60 overflow-y-auto custom-scrollbar">
            <div className="flex border-b border-gray-100">
              {onSelectAll && (
                <button
                  className="flex-1 px-4 py-2.5 text-xs font-semibold hover:bg-blue-50 text-blue-600 transition-colors text-left"
                  onClick={onSelectAll}
                >
                  Select All
                </button>
              )}
              {onDeselectAll && (
                <button
                  className="flex-1 px-4 py-2.5 text-xs font-semibold hover:bg-red-50 text-red-600 transition-colors text-right"
                  onClick={onDeselectAll}
                >
                  Clear
                </button>
              )}
            </div>

            {filteredOptions.map((option) => (
              <li
                key={option.value}
                className={`px-4 py-2.5 text-sm flex items-center justify-between cursor-pointer transition-colors duration-150 ${
                  selected.includes(option.value)
                    ? "bg-blue-50 text-blue-800 font-medium"
                    : "hover:bg-gray-50 text-gray-700"
                }`}
                onClick={() => handleItemToggle(option.value)}
              >
                {option.label}
                {selected.includes(option.value) && (
                  <CheckCircle className="w-4 h-4 text-blue-600" />
                )}
              </li>
            ))}
            {filteredOptions.length === 0 && (
              <li className="px-4 py-3 text-sm text-gray-500 italic text-center">
                No matches found.
              </li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
};

const DateRangePicker = ({ fromDate, toDate, onChange }) => {
  return (
    <div className="grid grid-cols-2 gap-3">
      <div>
        <label className="text-xs font-medium text-gray-600 block mb-1.5">
          From Date
        </label>
        <div className="relative">
          <input
            type="date"
            value={fromDate}
            onChange={(e) => onChange({ fromDate: e.target.value, toDate })}
            className="w-full bg-white border border-gray-200 rounded-xl shadow-sm px-4 py-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-blue-500 text-gray-700 pl-10"
          />
          <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
        </div>
      </div>
      <div>
        <label className="text-xs font-medium text-gray-600 block mb-1.5">
          To Date
        </label>
        <div className="relative">
          <input
            type="date"
            value={toDate}
            onChange={(e) => onChange({ fromDate, toDate: e.target.value })}
            className="w-full bg-white border border-gray-200 rounded-xl shadow-sm px-4 py-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-blue-500 text-gray-700 pl-10"
          />
          <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
        </div>
      </div>
    </div>
  );
};

const FilterPanel = ({ filters, setFilters, labOptions, onClear }) => {
  const { fromDate, toDate, selectedLabs } = filters;

  const handleLabToggle = (labList) => {
    setFilters((prev) => ({ ...prev, selectedLabs: labList }));
  };

  const handleSelectAllLabs = () => {
    setFilters((prev) => ({
      ...prev,
      selectedLabs: labOptions.map((l) => l.value),
    }));
  };

  const handleDeselectAllLabs = () => {
    setFilters((prev) => ({ ...prev, selectedLabs: [] }));
  };

  const handleClearFilters = () => {
    const today = new Date().toISOString().split("T")[0];
    setFilters({
      fromDate: today,
      toDate: today,
      selectedLabs: [],
    });
    if (onClear) onClear();
  };

  return (
    <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-600 shadow-md">
          <Filter className="w-5 h-5 text-white" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-gray-900">Analysis Filters</h2>
          <p className="text-xs text-gray-500">
            Filter pending parameters by date and lab
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-end">
        <div className="lg:col-span-5">
          <DateRangePicker
            fromDate={fromDate}
            toDate={toDate}
            onChange={({ fromDate, toDate }) => {
              setFilters((prev) => ({ ...prev, fromDate, toDate }));
            }}
          />
        </div>

        <div className="lg:col-span-4">
          <label className="text-xs font-medium text-gray-600 block mb-1.5">
            Lab Selection
          </label>
          <MultiSelectDropdown
            options={labOptions}
            selected={selectedLabs}
            onToggle={handleLabToggle}
            label="Labs"
            icon={FlaskConical}
            onSelectAll={handleSelectAllLabs}
            onDeselectAll={handleDeselectAllLabs}
          />
        </div>

        <div className="lg:col-span-3 flex justify-end gap-3">
          <button
            onClick={handleClearFilters}
            className="flex items-center gap-2 text-sm px-4 py-2.5 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-xl shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 transition-all duration-300"
          >
            <RefreshCcw className="w-4 h-4" />
            <span className="hidden sm:inline">Reset</span>
          </button>
        </div>
      </div>
    </div>
  );
};

// --- Custom Loader and Empty States ---

const AppLoader = ({ message }) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    className="flex flex-col justify-center items-center py-20 bg-white rounded-2xl shadow-xl border border-blue-100"
  >
    <motion.div
      animate={{ rotate: 360 }}
      transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
      className="p-3 rounded-full bg-blue-50/70 mb-4"
    >
      <Microscope className="w-10 h-10 text-blue-600" />
    </motion.div>
    <span className="text-xl font-bold text-gray-700">{message}</span>
    <span className="text-sm text-blue-400 mt-1">
      Fetching latest QA metrics...
    </span>
  </motion.div>
);

const NoDataFound = () => (
  <div className="flex flex-col justify-center items-center py-20 bg-white rounded-xl shadow-lg border border-gray-200">
    <div className="flex flex-col items-center">
      <div className="relative mb-6 w-20 h-20">
        <Search className="w-16 h-16 text-gray-300 absolute top-0 left-0" />
        <XCircle className="w-8 h-8 text-red-500 absolute bottom-0 right-0 p-1 bg-white rounded-full border-2 border-white" />
      </div>
      <span className="text-xl font-medium text-gray-600">No Data Found</span>
      <span className="text-sm text-gray-400 mt-2 max-w-md text-center">
        We couldn't find any data matching your filters. Try adjusting your
        filter selection.
      </span>
    </div>
  </div>
);

const DetailedLoader = ({ labName }) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    className="flex justify-center items-center py-8 bg-blue-50/50"
  >
    <Loader2 className="w-5 h-5 text-blue-700 animate-spin mr-3" />
    <span className="text-sm text-blue-700 font-medium">
      Fetching detailed parameters for {labName}...
    </span>
  </motion.div>
);

// --- Registration Row Component ---
const RegistrationRow = ({ registration, index }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const parameterCount = registration.parameters.length;

  return (
    <>
      <tr
        // Reduced vertical padding (py-3 instead of py-4) and smaller text
        className="hover:bg-blue-50/40 transition-all duration-200 cursor-pointer border-b border-gray-100 text-xs"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <td className="px-4 py-3">
          <div className="flex items-center gap-2">
            <motion.div
              animate={{ rotate: isExpanded ? 90 : 0 }}
              transition={{ duration: 0.2 }}
            >
              <ChevronRight className="w-4 h-4 text-gray-500" />
            </motion.div>
          </div>
        </td>
        <td className="px-4 py-3">
          <span className="font-semibold text-gray-900">
            {registration.registrationNo}
          </span>
        </td>
        <td className="px-4 py-3 max-w-60"> 
          <span className="text-gray-700 font-medium">
            {registration.sampleName}
          </span>
        </td>
        <td className="px-4 py-3 text-center">
          {/* Stacked dates for brevity */}
          <div className="space-y-0.5 leading-none">
            <p className="text-gray-700 font-medium text-xs">
              {formatDate(registration.registrationDate)}
            </p>
            <p className="text-xs text-green-600 font-medium">
              {formatDate(registration.analysisCompletionDateTime)}
            </p>
          </div>
        </td>
        <td className="px-4 py-3 text-center">
          <span className="inline-flex items-center px-2 py-0.5 text-xs font-bold text-red-700">
            {formatDate(registration.tatDate)}
          </span>
        </td>
        <td className="px-4 py-3 text-center">
          <span className="inline-flex items-center px-2 py-0.5 text-xs font-bold text-blue-700">
            {parameterCount}
          </span>
        </td>
      </tr>
      <AnimatePresence>
        {isExpanded && (
          <motion.tr
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <td colSpan="6" className="px-4 py-3 bg-gradient-to-br from-blue-100/50 to-cyan-100/30 border-y border-blue-100">
              <div className="ml-8">
                <div className="flex items-center gap-2 mb-2">
                  <TestTube2 className="w-4 h-4 text-blue-600" />
                  <span className="text-xs font-bold text-gray-700">
                    Pending Parameters ({parameterCount})
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {registration.parameters.map((param, idx) => (
                    <motion.div
                      key={idx}
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ delay: idx * 0.05 }}
                      className="inline-flex items-center gap-1.5 px-2 py-1 bg-white rounded-lg shadow-sm border border-blue-200 hover:shadow-md hover:border-blue-300 transition-all duration-200 text-xs"
                    >
                      <div className="w-1 h-1 rounded-full bg-blue-500"></div>
                      <span className="font-medium text-gray-800">
                        {param.name}
                      </span>
                    </motion.div>
                  ))}
                </div>
              </div>
            </td>
          </motion.tr>
        )}
      </AnimatePresence>
    </>
  );
};

// --- Aggregated Registration Table Component ---
const RegistrationTable = ({ registrations }) => {
  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200">
      <table className="min-w-full text-xs"> {/* Smaller text in table */}
        <thead className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white">
          <tr>
            <th className="px-3 py-2.5 text-left text-xs font-bold uppercase tracking-wide"> {/* Reduced padding */}
            </th>
            <th className="px-3 py-2.5 text-left text-xs font-bold uppercase tracking-wide">
              Registration No.
            </th>
            <th className="px-3 py-2.5 text-left text-xs font-bold uppercase tracking-wide">
              Sample Name
            </th>
            <th className="px-3 py-2.5 text-center text-xs font-bold uppercase tracking-wide">
              <div>Reg. Date / Comp. Date</div>
            </th>
            <th className="px-3 py-2.5 text-center text-xs font-bold uppercase tracking-wide">
              TAT Date
            </th>
            <th className="px-3 py-2.5 text-center text-xs font-bold uppercase tracking-wide">
              Params
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-100">
          {registrations.map((registration, idx) => (
            <RegistrationRow
              key={registration.registrationNo}
              registration={registration}
              index={idx}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
};

// --- Mobile Registration Card (No changes to maintain existing mobile UI) ---
const MobileRegistrationCard = ({ registration, index }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const parameterCount = registration.parameters.length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden"
    >
      {/* Card Header (Clickable) */}
      <div
        className="p-4 cursor-pointer transition-all duration-200"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="p-1.5 bg-blue-100 rounded-lg">
              <FileText className="w-4 h-4 text-blue-600" />
            </div>
            <div>
              <span className="text-xs text-gray-500 block">Reg. No.</span>
              <span className="font-bold text-gray-900">
                {registration.registrationNo}
              </span>
            </div>
          </div>
          <motion.div
            animate={{ rotate: isExpanded ? 180 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <ChevronDown className="w-5 h-5 text-gray-400" />
          </motion.div>
        </div>

        <div className="flex items-center gap-2 mb-3 pb-3 border-b border-gray-100">
          <Beaker className="w-4 h-4 text-gray-400" />
          <span className="text-sm text-gray-700">{registration.sampleName}</span>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-3">
          <div>
            <span className="text-xs text-gray-500 block mb-1">Reg. Date</span>
            <span className="text-sm font-medium text-gray-700">
              {formatDate(registration.registrationDate)}
            </span>
          </div>
          <div>
            <span className="text-xs text-gray-500 block mb-1">Comp. Date</span>
            <span className="text-sm font-medium text-green-600">
              {formatDate(registration.analysisCompletionDateTime)}
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-red-50 text-red-700 border border-red-200">
            <Clock className="w-3 h-3" />
            {formatDate(registration.tatDate)}
          </span>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-700">
            <TestTube2 className="w-3 h-3" />
            {parameterCount}
          </span>
        </div>
      </div>

      {/* Expanded Parameters Content */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden bg-gradient-to-br from-blue-50/50 to-cyan-50/30"
          >
            <div className="p-4 pt-2">
              <div className="flex items-center gap-2 mb-2">
                <TestTube2 className="w-4 h-4 text-blue-600" />
                <span className="text-xs font-bold text-gray-700">
                  Pending Parameters
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {registration.parameters.map((param, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: idx * 0.05 }}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-white rounded-lg shadow-sm border border-blue-200 text-xs font-medium text-gray-800"
                  >
                    <div className="w-1 h-1 rounded-full bg-blue-500"></div>
                    {param.name}
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

// --- LabGroup Component ---
const LabGroup = ({ labName, parameterCount, filters }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [parameters, setParameters] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Clear parameters when filters change
    if (!isExpanded) {
      setParameters([]);
    }
  }, [filters, isExpanded]);

  const fetchDetailedParameters = useCallback(async () => {
    if (!isExpanded || parameters.length > 0) return;

    setIsLoading(true);
    try {
      // Use the ISO 8601 helper function (FIXED)
      const fromDateTime = filters.fromDate 
        ? getISODateTime(filters.fromDate.split(' ')[0], 'start') // Extract YYYY-MM-DD from appliedFilters
        : undefined;
      const toDateTime = filters.toDate
        ? getISODateTime(filters.toDate.split(' ')[0], 'end') // Extract YYYY-MM-DD from appliedFilters
        : undefined;

      const payload = {
        fromDate: fromDateTime, // Now in YYYY-MM-DDTHH:MM:SS.sss format
        toDate: toDateTime,     // Now in YYYY-MM-DDTHH:MM:SS.sss format
        labs: [labName],
      };

      // NOTE: getPendingParametersQA is an API call, ensure it's defined and works
      const response = await getPendingParametersQA(payload);
      setParameters(Array.isArray(response) ? response : []);
    } catch (error) {
      console.error(`Failed to fetch parameters for ${labName}`, error);
      setParameters([]);
    } finally {
      setIsLoading(false);
    }
  }, [isExpanded, labName, filters.fromDate, filters.toDate, parameters.length]);

  useEffect(() => {
    if (isExpanded && parameters.length === 0) {
      fetchDetailedParameters();
    }
  }, [isExpanded, fetchDetailedParameters, parameters.length]);

  const handleToggle = () => {
    setIsExpanded((prev) => !prev);
  };

  const aggregatedData = useMemo(() => {
    return aggregateByRegistration(parameters);
  }, [parameters]);

  const registrationCount = aggregatedData.length;

  const content = useMemo(() => {
    if (isLoading && isExpanded) {
      return <DetailedLoader labName={labName} />;
    }

    if (isExpanded && aggregatedData.length > 0) {
      return (
        <>
          {/* Desktop View */}
          <div className="hidden lg:block p-6">
            <RegistrationTable registrations={aggregatedData} />
          </div>
          
          {/* Mobile View */}
          <div className="lg:hidden p-4 space-y-3 bg-gray-50">
            {aggregatedData.map((registration, i) => (
              <MobileRegistrationCard
                key={registration.registrationNo}
                registration={registration}
                index={i}
              />
            ))}
          </div>
        </>
      );
    }

    if (isExpanded && parameterCount > 0 && aggregatedData.length === 0 && !isLoading) {
      return (
        <div className="flex justify-center items-center py-8">
          <AlertCircle className="w-5 h-5 text-orange-500 mr-3" />
          <span className="text-gray-500 text-sm">
            Detailed data not available or may be out of sync.
          </span>
        </div>
      );
    }

    return null;
  }, [isLoading, isExpanded, aggregatedData, parameterCount, labName]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden"
    >
      {/* Lab Header */}
      <div
        onClick={handleToggle}
        className="px-6 py-4 cursor-pointer transition-all duration-200 flex items-center justify-between bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700"
      >
        <div className="flex items-center gap-4">
          <div className="p-2 rounded-lg bg-white/20 backdrop-blur-sm text-white shadow-inner">
            <Microscope className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-white tracking-tight">
              {labName || "Unknown Lab"}
            </h3>
            <p className="text-xs text-blue-100 mt-0.5">
              {registrationCount > 0 && isExpanded
                ? `${registrationCount} registration${registrationCount !== 1 ? 's' : ''} • ${parameterCount} parameter${parameterCount !== 1 ? 's' : ''}`
                : `Click to view pending registrations and associate parameters.`
              }
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">

          <motion.div
            animate={{ rotate: isExpanded ? 180 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <ChevronDown className="w-5 h-5 text-white/80" />
          </motion.div>
        </div>
      </div>
      
      {/* Expanded Content Section */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            {content}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

// --- Main Component ---

export default function QAAnalysis({ username, designation }) {
  const [filters, setFilters] = useState({
    fromDate: new Date().toISOString().split("T")[0],
    toDate: new Date().toISOString().split("T")[0],
    selectedLabs: [],
  });

  const [labOptions, setLabOptions] = useState([]);
  const [overviewData, setOverviewData] = useState([]);
  const [isLoadingOverview, setIsLoadingOverview] = useState(false);
  const [isFetchingLabs, setIsFetchingLabs] = useState(true);
  
  // appliedFilters will store the actual ISO string sent to the API
  const [appliedFilters, setAppliedFilters] = useState({
    fromDate: getISODateTime(new Date().toISOString().split("T")[0], 'start'),
    toDate: getISODateTime(new Date().toISOString().split("T")[0], 'end'),
    selectedLabs: [],
  });

  // Fetch Lab Names on Mount
  useEffect(() => {
    const fetchLabs = async () => {
      setIsFetchingLabs(true);
      try {
        const response = await getLabNames({});
        let formattedLabs = [];
        if (Array.isArray(response)) {
          formattedLabs = response.map((lab) => {
            if (typeof lab === "string") return { value: lab, label: lab };
            return { value: lab.name || lab.id, label: lab.name || lab.label };
          });
        }
        setLabOptions(formattedLabs);
      } catch (error) {
        console.error("Failed to fetch lab names", error);
      } finally {
        setIsFetchingLabs(false);
      }
    };
    fetchLabs();
  }, []);

  // Fetch Overview Data
  const fetchOverviewData = useCallback(async (filtersToApply) => {
    setIsLoadingOverview(true);
    
    // 1. Convert the YYYY-MM-DD format from the picker into ISO 8601 DateTime (FIXED)
    const fromDateTimeISO = filtersToApply.fromDate 
      ? getISODateTime(filtersToApply.fromDate, 'start') 
      : undefined;
    const toDateTimeISO = filtersToApply.toDate 
      ? getISODateTime(filtersToApply.toDate, 'end') 
      : undefined;
    
    // 2. Update appliedFilters state to reflect the actual ISO strings sent
    setAppliedFilters({ 
        ...filtersToApply,
        fromDate: fromDateTimeISO, // Store the ISO string
        toDate: toDateTimeISO      // Store the ISO string
    });

    try {
      const payload = {
        fromDate: fromDateTimeISO, // Sending correct ISO format
        toDate: toDateTimeISO,     // Sending correct ISO format
        labs:
          filtersToApply.selectedLabs.length > 0
            ? filtersToApply.selectedLabs
            : undefined,
      };

      const response = await getPendingParametersOverviewQA(payload);
      setOverviewData(Array.isArray(response) ? response : []);
    } catch (error) {
      console.error("Failed to fetch QA parameters overview", error);
      setOverviewData([]);
    } finally {
      setIsLoadingOverview(false);
    }
  }, []);

  // Effect to trigger data fetch whenever the filter date/lab state changes
  useEffect(() => {
    const handler = setTimeout(() => {
      fetchOverviewData(filters);
    }, 300);

    return () => {
      clearTimeout(handler);
    };
  }, [filters, fetchOverviewData]);

  // Function to handle reset
  const handleClearFilters = () => {
    const today = new Date().toISOString().split("T")[0];
    setFilters({ fromDate: today, toDate: today, selectedLabs: [] });
  };

  // Sorting the overview data by lab name
  const sortedOverviewData = useMemo(() => {
    return overviewData
      .filter((item) => item.parameterCount > 0)
      .sort((a, b) => a.labName.localeCompare(b.labName));
  }, [overviewData]);

  // Total parameter count for display
  const totalParameters = useMemo(() => {
    return sortedOverviewData.reduce(
      (sum, item) => sum + item.parameterCount,
      0
    );
  }, [sortedOverviewData]);

  return (
    <div className="font-sans min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-2xl shadow-2xl mb-8 bg-white border border-gray-200"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-600 opacity-95"></div>
          <div className="relative p-6 sm:p-8 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <motion.div
                animate={{ rotate: [0, 360] }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                className="p-3 rounded-xl bg-white/10 backdrop-blur-sm shadow-lg"
              >
                <FaMagnifyingGlass className="w-7 h-7 text-white" />
              </motion.div>
              <div>
                <div className="flex flex-row gap-4">
                  <h1 className="text-2xl font-bold text-white tracking-tight">
                    QA Analysis
                  </h1>
                  {totalParameters !== 0 && (
                    <div className="hidden md:block">
                      <div className="flex items-center gap-2 px-3 py-1.5 bg-white/10 rounded-lg text-white text-xs font-medium backdrop-blur-md border border-white/20">
                        <ListFilter className="w-4 h-4" />
                        <span>{totalParameters} Parameters Pending</span>
                      </div>
                    </div>
                  )}
                </div>

                <p className="text-blue-100 text-sm mt-1">
                  Track and manage parameters pending in QA
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 text-right flex-shrink-0">
              <div className="text-white">
                <p className="text-lg font-semibold leading-snug">{username}</p>
                <p className="text-blue-200 text-xs font-medium leading-snug">
                  {designation}
                </p>
              </div>
              <div className="p-2 rounded-full bg-white/20 backdrop-blur-sm shadow-lg">
                <User className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
        </motion.div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8"
        >
          <FilterPanel
            filters={filters}
            setFilters={setFilters}
            labOptions={labOptions}
            onClear={handleClearFilters}
          />
        </motion.div>

        {/* Content */}
        {isLoadingOverview || isFetchingLabs ? (
          <AppLoader message="Loading analysis overview..." />
        ) : sortedOverviewData.length === 0 ? (
          <NoDataFound />
        ) : (
          <div className="space-y-4">
            {sortedOverviewData.map((labData) => (
              <LabGroup
                key={labData.labName}
                labName={labData.labName}
                parameterCount={labData.parameterCount}
                // Pass the actual ISO date string from appliedFilters to LabGroup
                filters={{
                    ...filters,
                    fromDate: appliedFilters.fromDate,
                    toDate: appliedFilters.toDate
                }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
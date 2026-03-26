import React, { useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import axios from "axios";
import { API, useAuth } from "../App";
import { toast } from "sonner";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Calendar } from "../components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "../components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "../components/ui/select";
import {
  Plus,
  MagnifyingGlass,
  Funnel,
  PawPrint,
  MapPin,
  Calendar as CalendarIcon,
  Eye,
  X
} from "@phosphor-icons/react";
import { formatDate } from "../utils/dateFormat";

const CaseList = () => {
  const { token } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [cases, setCases] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [showFilters, setShowFilters] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [customDateFrom, setCustomDateFrom] = useState(null);
  const [customDateTo, setCustomDateTo] = useState(null);
  const [filters, setFilters] = useState({
    status: searchParams.get("status") || "",
    condition: searchParams.get("condition") || "",
    case_type: searchParams.get("case_type") || "",
    shelter: searchParams.get("shelter") || "",
    sterilisation_status: searchParams.get("sterilisation_status") || "",
    date_filter: searchParams.get("date_filter") || ""
  });

  useEffect(() => {
    fetchCases();
  }, [filters, search, customDateFrom, customDateTo]);

  const fetchCases = async () => {
    try {
      const params = new URLSearchParams();
      if (search) params.append("search", search);
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value);
      });
      if (customDateFrom) params.append("date_from", customDateFrom.toISOString().split('T')[0]);
      if (customDateTo) params.append("date_to", customDateTo.toISOString().split('T')[0]);

      const [casesRes, countRes] = await Promise.all([
        axios.get(`${API}/cases?${params.toString()}`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get(`${API}/cases/count?${params.toString()}`, {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);
      setCases(casesRes.data);
      setTotalCount(countRes.data.count);
    } catch (error) {
      toast.error("Failed to load cases");
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    const newFilters = { ...filters, [key]: value };
    // Clear custom dates if selecting preset date filter
    if (key === "date_filter" && value) {
      setCustomDateFrom(null);
      setCustomDateTo(null);
    }
    setFilters(newFilters);
    
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    Object.entries(newFilters).forEach(([k, v]) => {
      if (v) params.set(k, v);
    });
    setSearchParams(params);
  };

  const handleCustomDateApply = () => {
    setFilters({ ...filters, date_filter: "" });
    setShowDatePicker(false);
  };

  const clearFilters = () => {
    setFilters({
      status: "",
      condition: "",
      case_type: "",
      shelter: "",
      sterilisation_status: "",
      date_filter: ""
    });
    setCustomDateFrom(null);
    setCustomDateTo(null);
    setSearch("");
    setSearchParams({});
  };

  const hasActiveFilters = Object.values(filters).some(v => v) || search || customDateFrom || customDateTo;
  const activeFilterCount = Object.values(filters).filter(v => v).length + (search ? 1 : 0) + (customDateFrom || customDateTo ? 1 : 0);

  const getConditionClass = (condition) => {
    const classes = {
      Critical: "condition-critical",
      Injury: "condition-injured",
      Sick: "condition-sick",
      Accident: "bg-red-600 text-white",
      Cancer: "bg-purple-600 text-white",
      "Canine Distemper": "bg-orange-600 text-white",
      "Parvo Virus": "bg-red-700 text-white",
      "Not Sure": "bg-gray-500 text-white"
    };
    return classes[condition] || "bg-gray-500 text-white";
  };

  const getStatusClass = (status) => {
    if (["Deceased"].includes(status)) return "status-critical";
    if (["Under Observation", "In Govt Shelter", "In Private Shelter"].includes(status)) return "status-warning";
    if (["Released", "Adopted"].includes(status)) return "status-success";
    return "status-info";
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#4CAF50] border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#1C1917]" style={{ fontFamily: 'Manrope' }}>
            Cases
          </h1>
          <p className="text-[#57534E] mt-1">
            {hasActiveFilters ? `${totalCount} cases found` : `${totalCount} total cases`}
          </p>
        </div>
        <Link to="/cases/new">
          <Button 
            className="h-14 px-6 bg-[#4CAF50] hover:bg-[#43A047] text-white font-semibold rounded-lg flex items-center gap-2 w-full sm:w-auto"
            data-testid="new-case-button"
          >
            <Plus size={22} weight="bold" />
            New Case
          </Button>
        </Link>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white border border-[#E7E5E4] rounded-lg p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <MagnifyingGlass className="absolute left-4 top-1/2 -translate-y-1/2 text-[#78716C]" size={20} />
            <Input
              placeholder="Search by case ID, name, or location..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-12 pl-12 bg-[#F5F5F4] border-2 border-[#E7E5E4] focus:border-[#4CAF50]"
              data-testid="search-input"
            />
          </div>
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
            className={`h-12 px-4 border-2 ${showFilters ? 'border-[#4CAF50] bg-[#E8F5E9]' : 'border-[#E7E5E4]'}`}
            data-testid="filter-toggle-button"
          >
            <Funnel size={20} />
            <span className="ml-2">Filters</span>
            {activeFilterCount > 0 && (
              <span className="ml-2 w-5 h-5 bg-[#4CAF50] text-white text-xs rounded-full flex items-center justify-center">
                {activeFilterCount}
              </span>
            )}
          </Button>
        </div>

        {/* Filter Panel */}
        {showFilters && (
          <div className="mt-4 pt-4 border-t border-[#E7E5E4]">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
              {/* Date Filter */}
              <Select value={filters.date_filter} onValueChange={(v) => handleFilterChange("date_filter", v)}>
                <SelectTrigger className="h-12" data-testid="filter-date">
                  <SelectValue placeholder="Date Range" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="yesterday">Yesterday</SelectItem>
                  <SelectItem value="last7days">Last 7 Days</SelectItem>
                  <SelectItem value="last30days">Last 30 Days</SelectItem>
                </SelectContent>
              </Select>

              {/* Custom Date Range */}
              <Popover open={showDatePicker} onOpenChange={setShowDatePicker}>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="h-12 justify-start border-2" data-testid="custom-date-button">
                    <CalendarIcon size={18} className="mr-2" />
                    {customDateFrom && customDateTo 
                      ? `${formatDate(customDateFrom)} - ${formatDate(customDateTo)}`
                      : "Custom Date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-4" align="start">
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm font-medium mb-2">From Date</p>
                      <Calendar
                        mode="single"
                        selected={customDateFrom}
                        onSelect={setCustomDateFrom}
                        initialFocus
                      />
                    </div>
                    <div>
                      <p className="text-sm font-medium mb-2">To Date</p>
                      <Calendar
                        mode="single"
                        selected={customDateTo}
                        onSelect={setCustomDateTo}
                      />
                    </div>
                    <Button onClick={handleCustomDateApply} className="w-full bg-[#4CAF50] text-white">
                      Apply
                    </Button>
                  </div>
                </PopoverContent>
              </Popover>

              <Select value={filters.status} onValueChange={(v) => handleFilterChange("status", v)}>
                <SelectTrigger className="h-12" data-testid="filter-status">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Rescued (Status Pending)">Rescued (Status Pending)</SelectItem>
                  <SelectItem value="In Govt Shelter">In Govt Shelter</SelectItem>
                  <SelectItem value="In Private Shelter">In Private Shelter</SelectItem>
                  <SelectItem value="In SEVA Shelter">In SEVA Shelter</SelectItem>
                  <SelectItem value="Under Observation">Under Observation</SelectItem>
                  <SelectItem value="Released">Released</SelectItem>
                  <SelectItem value="Permanent Resident">Permanent Resident</SelectItem>
                  <SelectItem value="Adopted">Adopted</SelectItem>
                  <SelectItem value="Deceased">Deceased</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filters.condition} onValueChange={(v) => handleFilterChange("condition", v)}>
                <SelectTrigger className="h-12" data-testid="filter-condition">
                  <SelectValue placeholder="Condition" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Accident">Accident</SelectItem>
                  <SelectItem value="Cancer">Cancer</SelectItem>
                  <SelectItem value="Injury">Injury</SelectItem>
                  <SelectItem value="Sick">Sick</SelectItem>
                  <SelectItem value="Critical">Critical</SelectItem>
                  <SelectItem value="Canine Distemper">Canine Distemper</SelectItem>
                  <SelectItem value="Parvo Virus">Parvo Virus</SelectItem>
                  <SelectItem value="Not Sure">Not Sure</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filters.case_type} onValueChange={(v) => handleFilterChange("case_type", v)}>
                <SelectTrigger className="h-12" data-testid="filter-case-type">
                  <SelectValue placeholder="Case Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Rescue Case">Rescue Case</SelectItem>
                  <SelectItem value="Sterilisation Only Case">Sterilisation Only</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filters.sterilisation_status} onValueChange={(v) => handleFilterChange("sterilisation_status", v)}>
                <SelectTrigger className="h-12" data-testid="filter-sterilisation">
                  <SelectValue placeholder="Sterilisation" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Not Required">Not Required</SelectItem>
                  <SelectItem value="Pending">Pending</SelectItem>
                  <SelectItem value="Completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {hasActiveFilters && (
              <Button
                variant="ghost"
                onClick={clearFilters}
                className="mt-3 text-[#DC2626] hover:bg-red-50"
                data-testid="clear-filters-button"
              >
                <X size={18} />
                <span className="ml-2">Clear all filters</span>
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Cases List */}
      {cases.length === 0 ? (
        <div className="bg-white border border-[#E7E5E4] rounded-lg p-8 text-center">
          <PawPrint size={48} className="mx-auto text-[#D6D3D1]" />
          <h3 className="text-lg font-semibold text-[#1C1917] mt-4">No cases found</h3>
          <p className="text-[#57534E] mt-2">
            {hasActiveFilters ? "Try adjusting your filters" : "Create your first case to get started"}
          </p>
          {!hasActiveFilters && (
            <Link to="/cases/new">
              <Button className="mt-4 bg-[#4CAF50] hover:bg-[#43A047] text-white">
                <Plus size={20} className="mr-2" />
                Create Case
              </Button>
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {cases.map((caseItem) => (
            <CaseCard key={caseItem.id} caseData={caseItem} />
          ))}
        </div>
      )}
    </div>
  );
};

const CaseCard = ({ caseData }) => {
  const { token } = useAuth();
  
  const getConditionClass = (condition) => {
    const classes = {
      Critical: "condition-critical",
      Injury: "condition-injured",
      Sick: "condition-sick",
      Accident: "bg-red-600 text-white",
      Cancer: "bg-purple-600 text-white",
      "Canine Distemper": "bg-orange-600 text-white",
      "Parvo Virus": "bg-red-700 text-white",
      "Not Sure": "bg-gray-500 text-white"
    };
    return classes[condition] || "bg-gray-500 text-white";
  };

  const getStatusClass = (status) => {
    if (["Deceased"].includes(status)) return "status-critical";
    if (["Under Observation", "In Govt Shelter", "In Private Shelter"].includes(status)) return "status-warning";
    if (["Released", "Adopted"].includes(status)) return "status-success";
    return "status-info";
  };

  // Get the first image URL if available
  const getImageUrl = () => {
    if (caseData.images?.length > 0) {
      const img = caseData.images[0];
      return `${API}/files/${img.storage_path}?auth=${token}`;
    }
    return null;
  };

  const thumbnailUrl = getImageUrl();

  return (
    <Link 
      to={`/cases/${caseData.id}`}
      className="block bg-white border border-[#E7E5E4] rounded-lg p-4 hover:border-[#4CAF50] transition-all"
      data-testid={`case-card-${caseData.case_id}`}
    >
      <div className="flex gap-4">
        {/* Image */}
        <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-lg bg-[#F5F5F4] overflow-hidden flex-shrink-0">
          {thumbnailUrl ? (
            <img 
              src={thumbnailUrl} 
              alt={caseData.animal_name || "Animal"}
              className="w-full h-full object-cover"
              onError={(e) => {
                e.target.style.display = 'none';
                e.target.nextSibling.style.display = 'flex';
              }}
            />
          ) : null}
          <div 
            className="w-full h-full flex items-center justify-center text-[#78716C]"
            style={{ display: thumbnailUrl ? 'none' : 'flex' }}
          >
            <PawPrint size={32} />
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-start gap-2 mb-2">
            <span className="text-sm font-mono font-semibold text-[#4CAF50]">
              {caseData.case_id}
            </span>
            {caseData.condition && (
              <span className={`px-2 py-0.5 text-xs font-semibold rounded ${getConditionClass(caseData.condition)}`}>
                {caseData.condition}
              </span>
            )}
            <span className={`px-2 py-0.5 text-xs font-medium rounded ${getStatusClass(caseData.status)}`}>
              {caseData.status}
            </span>
          </div>

          <h3 className="font-semibold text-[#1C1917] truncate">
            {caseData.animal_name || `${caseData.animal_type} - ${caseData.case_type}`}
          </h3>

          <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-[#57534E]">
            <span className="flex items-center gap-1">
              <MapPin size={16} />
              <span className="truncate max-w-[150px]">{caseData.rescue_location}</span>
            </span>
            <span className="flex items-center gap-1">
              <CalendarIcon size={16} />
              {formatDate(caseData.rescue_date)}
            </span>
          </div>

          <div className="flex items-center gap-2 mt-2">
            <span className="text-xs px-2 py-0.5 bg-[#F5F5F4] rounded text-[#57534E]">
              {caseData.animal_type}
            </span>
            {caseData.sterilisation_status === "Completed" && (
              <span className="text-xs px-2 py-0.5 bg-[#E8F5E9] rounded text-[#1B5E20]">
                Sterilised
              </span>
            )}
            {caseData.sterilisation_status === "Pending" && (
              <span className="text-xs px-2 py-0.5 bg-[#FEF3C7] rounded text-[#92400E]">
                Sterilisation Pending
              </span>
            )}
          </div>
        </div>

        {/* Action */}
        <div className="hidden sm:flex items-center">
          <div className="p-2 rounded-lg bg-[#F5F5F4] text-[#78716C]">
            <Eye size={20} />
          </div>
        </div>
      </div>
    </Link>
  );
};

export default CaseList;

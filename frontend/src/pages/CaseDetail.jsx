import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import axios from "axios";
import { API, useAuth } from "../App";
import { toast } from "sonner";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "../components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from "../components/ui/dialog";
import {
  ArrowLeft,
  PencilSimple,
  Trash,
  Plus,
  Camera,
  VideoCamera,
  FirstAid,
  Syringe,
  MapPin,
  House,
  ClockCounterClockwise,
  Upload,
  X,
  PawPrint,
  Note,
  User,
  FileText,
  Warning,
  CheckCircle,
  Phone
} from "@phosphor-icons/react";
import { formatDate, formatTime, formatTimestamp } from "../utils/dateFormat";

const CaseDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { token, isAdmin } = useAuth();
  const [caseData, setCaseData] = useState(null);
  const [vetCheckups, setVetCheckups] = useState([]);
  const [sterilisations, setSterilisations] = useState([]);
  const [movements, setMovements] = useState([]);
  const [specialNotes, setSpecialNotes] = useState([]);
  const [vetNames, setVetNames] = useState([]);
  const [sterilLocations, setSterilLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");

  // Dialogs
  const [showVetDialog, setShowVetDialog] = useState(false);
  const [showEditVetDialog, setShowEditVetDialog] = useState(false);
  const [editingCheckup, setEditingCheckup] = useState(null);
  const [showSterilDialog, setShowSterilDialog] = useState(false);
  const [showEditSterilDialog, setShowEditSterilDialog] = useState(false);
  const [editingSteril, setEditingSteril] = useState(null);
  const [showMovementDialog, setShowMovementDialog] = useState(false);
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [showNoteDialog, setShowNoteDialog] = useState(false);
  const [uploadType, setUploadType] = useState("image");

  useEffect(() => {
    fetchAllData();
  }, [id]);

  const fetchAllData = async () => {
    try {
      const [caseRes, vetRes, sterilRes, movementRes, notesRes, vetNamesRes, locationsRes] = await Promise.all([
        axios.get(`${API}/cases/${id}`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API}/vet-checkups?case_id=${id}`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API}/sterilisations?case_id=${id}`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API}/movements?case_id=${id}`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API}/special-notes?case_id=${id}`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API}/vet-names`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API}/sterilisation-locations`, { headers: { Authorization: `Bearer ${token}` } })
      ]);
      setCaseData(caseRes.data);
      setVetCheckups(vetRes.data);
      setSterilisations(sterilRes.data);
      setMovements(movementRes.data);
      setSpecialNotes(notesRes.data);
      setVetNames(vetNamesRes.data);
      setSterilLocations(locationsRes.data);
    } catch (error) {
      toast.error("Failed to load case details");
      navigate("/cases");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("Are you sure you want to delete this case?")) return;
    try {
      await axios.delete(`${API}/cases/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success("Case deleted successfully");
      navigate("/cases");
    } catch (error) {
      toast.error("Failed to delete case");
    }
  };

  const handleUpload = async (file, type, description) => {
    const formData = new FormData();
    formData.append("file", file);

    try {
      const endpoint = type === "image" ? "images" : "videos";
      await axios.post(`${API}/cases/${id}/${endpoint}?description=${encodeURIComponent(description)}`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data"
        }
      });
      toast.success(`${type === "image" ? "Image" : "Video"} uploaded successfully`);
      fetchAllData();
      setShowUploadDialog(false);
    } catch (error) {
      toast.error("Upload failed");
    }
  };

  const openEditCheckup = (checkup) => {
    setEditingCheckup(checkup);
    setShowEditVetDialog(true);
  };

  const openEditSteril = (steril) => {
    setEditingSteril(steril);
    setShowEditSterilDialog(true);
  };

  const handleReporterInformed = async (informed) => {
    try {
      await axios.put(`${API}/cases/${id}/reporter-informed?informed=${informed}`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success(informed ? "Reporter marked as informed" : "Reporter status reset");
      fetchAllData();
    } catch (error) {
      toast.error("Failed to update reporter status");
    }
  };

  const handleDeleteCheckup = async (checkupId) => {
    if (!window.confirm("Are you sure you want to delete this vet checkup?")) return;
    try {
      await axios.delete(`${API}/vet-checkups/${checkupId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success("Vet checkup deleted successfully");
      fetchAllData();
    } catch (error) {
      toast.error("Failed to delete vet checkup");
    }
  };

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

  // Generate image URL from storage path
  const getImageUrl = (storagePath) => {
    return `${API}/files/${storagePath}?auth=${token}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#4CAF50] border-t-transparent"></div>
      </div>
    );
  }

  if (!caseData) return null;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/cases")}
            className="p-2 rounded-lg hover:bg-[#F5F5F4] text-[#57534E]"
            data-testid="back-button"
          >
            <ArrowLeft size={24} />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-bold text-[#1C1917]" style={{ fontFamily: 'Manrope' }}>
                {caseData.case_id}
              </h1>
              {caseData.condition && (
                <span className={`px-2 py-0.5 text-xs font-semibold rounded ${getConditionClass(caseData.condition)}`}>
                  {caseData.condition}
                </span>
              )}
            </div>
            <p className="text-[#57534E] mt-0.5">
              {caseData.animal_name || caseData.animal_type} • {caseData.case_type}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link to={`/cases/${id}/edit`}>
            <Button variant="outline" className="h-12 border-2" data-testid="edit-case-button">
              <PencilSimple size={20} />
              <span className="ml-2 hidden sm:inline">Edit</span>
            </Button>
          </Link>
          {isAdmin && (
            <Button
              variant="outline"
              onClick={handleDelete}
              className="h-12 border-2 border-red-200 text-[#DC2626] hover:bg-red-50"
              data-testid="delete-case-button"
            >
              <Trash size={20} />
              <span className="ml-2 hidden sm:inline">Delete</span>
            </Button>
          )}
        </div>
      </div>

      {/* Status Bar with Creator Info */}
      <div className="bg-white border border-[#E7E5E4] rounded-lg p-4 flex flex-wrap items-center gap-4">
        <span className={`px-3 py-1 text-sm font-medium rounded ${getStatusClass(caseData.status)}`}>
          {caseData.status}
        </span>
        {caseData.current_shelter && (
          <span className="flex items-center gap-2 text-sm text-[#57534E]">
            <House size={18} />
            {caseData.current_shelter}
          </span>
        )}
        <span className="flex items-center gap-2 text-sm text-[#57534E]">
          <Syringe size={18} />
          Sterilisation: {caseData.sterilisation_status}
        </span>
        <span className="flex items-center gap-2 text-sm text-[#78716C] ml-auto">
          <User size={18} />
          Added by {caseData.created_by_name || "Unknown"} on {formatTimestamp(caseData.created_at)}
        </span>
      </div>

      {/* Reporter Informed Banner - Only shown for Deceased cases */}
      {caseData.status === "Deceased" && (
        <div className={`rounded-lg p-4 border-2 ${
          caseData.reporter_informed 
            ? "bg-[#E8F5E9] border-[#4CAF50]" 
            : "bg-[#FEF3C7] border-[#F59E0B]"
        }`}>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-start gap-3">
              {caseData.reporter_informed ? (
                <CheckCircle size={24} className="text-[#1B5E20] flex-shrink-0 mt-0.5" weight="fill" />
              ) : (
                <Warning size={24} className="text-[#92400E] flex-shrink-0 mt-0.5" weight="fill" />
              )}
              <div>
                <p className={`font-semibold ${caseData.reporter_informed ? "text-[#1B5E20]" : "text-[#92400E]"}`}>
                  {caseData.reporter_informed 
                    ? `Reporter informed for the passing of ${caseData.animal_name || caseData.animal_type} (${caseData.case_id})`
                    : `Reporter informed for the passing of ${caseData.animal_name || caseData.animal_type} (${caseData.case_id})?`
                  }
                </p>
                {caseData.reporter_informed && caseData.reporter_informed_at && (
                  <p className="text-sm text-[#1B5E20] mt-1">
                    Marked by {caseData.reporter_informed_by || "Unknown"} on {formatTimestamp(caseData.reporter_informed_at)}
                  </p>
                )}
                {!caseData.reporter_informed && caseData.reporter_name && caseData.reporter_contact && (
                  <p className="text-sm text-[#92400E] mt-1 flex items-center gap-2">
                    <Phone size={16} />
                    Contact: {caseData.reporter_name} - {caseData.reporter_contact}
                  </p>
                )}
              </div>
            </div>
            <div className="flex gap-2 sm:flex-shrink-0">
              {caseData.reporter_informed ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleReporterInformed(false)}
                  className="h-10 border-[#1B5E20] text-[#1B5E20] hover:bg-[#C8E6C9]"
                  data-testid="reset-reporter-informed"
                >
                  Reset Status
                </Button>
              ) : (
                <>
                  <Button
                    size="sm"
                    onClick={() => handleReporterInformed(true)}
                    className="h-10 bg-[#4CAF50] hover:bg-[#43A047] text-white"
                    data-testid="mark-reporter-informed"
                  >
                    <CheckCircle size={18} className="mr-2" />
                    Yes, Informed
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="w-full flex bg-white border border-[#E7E5E4] rounded-lg p-1 h-auto flex-wrap">
          {["overview", "medical", "sterilisation", "media", "notes", "activity"].map((tab) => (
            <TabsTrigger
              key={tab}
              value={tab}
              className="flex-1 min-w-[80px] h-12 data-[state=active]:bg-[#E8F5E9] data-[state=active]:text-[#1B5E20] capitalize font-medium"
              data-testid={`tab-${tab}`}
            >
              {tab}
            </TabsTrigger>
          ))}
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="mt-4 space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Animal Info */}
            <div className="bg-white border border-[#E7E5E4] rounded-lg p-5">
              <h3 className="text-lg font-semibold text-[#1C1917] mb-4 flex items-center gap-2" style={{ fontFamily: 'Manrope' }}>
                <PawPrint size={22} className="text-[#4CAF50]" />
                Animal Information
              </h3>
              <div className="space-y-3">
                <InfoRow label="Name" value={caseData.animal_name || "Not named"} />
                <InfoRow label="Type" value={caseData.animal_type} />
                <InfoRow label="Gender" value={caseData.gender || "Unknown"} />
                <InfoRow label="Age" value={caseData.age || "Unknown"} />
                <InfoRow label="Condition" value={caseData.condition || "N/A"} />
                {caseData.condition_notes && (
                  <InfoRow label="Notes" value={caseData.condition_notes} />
                )}
              </div>
            </div>

            {/* Rescue Info */}
            <div className="bg-white border border-[#E7E5E4] rounded-lg p-5">
              <h3 className="text-lg font-semibold text-[#1C1917] mb-4 flex items-center gap-2" style={{ fontFamily: 'Manrope' }}>
                <MapPin size={22} className="text-[#4CAF50]" />
                Rescue Details
              </h3>
              <div className="space-y-3">
                <InfoRow 
                  label="Date & Time" 
                  value={`${formatDate(caseData.rescue_date)}${caseData.rescue_time ? ` at ${formatTime(caseData.rescue_time)}` : ""}`} 
                />
                <InfoRow label="Location" value={caseData.rescue_location} />
                <InfoRow label="Area" value={caseData.area || "Not specified"} />
                <InfoRow label="Reporter" value={caseData.reporter_name || "Unknown"} />
                <InfoRow label="Contact" value={caseData.reporter_contact || "Not provided"} />
              </div>
            </div>
          </div>
        </TabsContent>

        {/* Medical Tab */}
        <TabsContent value="medical" className="mt-4 space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold text-[#1C1917]" style={{ fontFamily: 'Manrope' }}>
              Vet Checkups
            </h3>
            <Button
              onClick={() => setShowVetDialog(true)}
              className="h-12 bg-[#4CAF50] hover:bg-[#43A047] text-white"
              data-testid="add-vet-checkup-button"
            >
              <Plus size={20} />
              <span className="ml-2">Add Checkup</span>
            </Button>
          </div>

          {vetCheckups.length === 0 ? (
            <div className="bg-white border border-[#E7E5E4] rounded-lg p-8 text-center">
              <FirstAid size={48} className="mx-auto text-[#D6D3D1]" />
              <p className="text-[#57534E] mt-4">No vet checkups recorded yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {vetCheckups.map((checkup) => (
                <div key={checkup.id} className="bg-white border border-[#E7E5E4] rounded-lg p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-semibold text-[#1C1917]">
                        {formatDate(checkup.checkup_date)}
                      </p>
                      <p className="text-sm text-[#57534E]">By {checkup.vet_name}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {checkup.next_followup_date && !checkup.followup_completed && (
                        <span className="text-xs px-2 py-1 bg-[#FEF3C7] text-[#92400E] rounded">
                          Follow-up: {formatDate(checkup.next_followup_date)}
                        </span>
                      )}
                      {checkup.followup_completed && (
                        <span className="text-xs px-2 py-1 bg-[#E8F5E9] text-[#1B5E20] rounded">
                          Completed
                        </span>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openEditCheckup(checkup)}
                        className="h-8"
                        data-testid={`edit-checkup-${checkup.id}`}
                      >
                        <PencilSimple size={16} />
                      </Button>
                      {isAdmin && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteCheckup(checkup.id)}
                          className="h-8 text-red-600 border-red-300 hover:bg-red-50"
                          data-testid={`delete-checkup-${checkup.id}`}
                        >
                          <Trash size={16} />
                        </Button>
                      )}
                    </div>
                  </div>
                  {checkup.notes && (
                    <p className="mt-3 text-sm text-[#57534E] bg-[#F5F5F4] rounded p-3">
                      {checkup.notes}
                    </p>
                  )}
                  {checkup.prescription && (
                    <div className="mt-3 p-3 bg-blue-50 rounded flex items-center gap-2">
                      <FileText size={18} className="text-blue-600" />
                      <span className="text-sm text-blue-700">
                        Prescription: {checkup.prescription.original_filename}
                      </span>
                      <span className="text-xs text-blue-500 ml-auto">
                        {formatTimestamp(checkup.prescription.uploaded_at)}
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Sterilisation Tab */}
        <TabsContent value="sterilisation" className="mt-4 space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold text-[#1C1917]" style={{ fontFamily: 'Manrope' }}>
              Sterilisation Records
            </h3>
            <Button
              onClick={() => setShowSterilDialog(true)}
              className="h-12 bg-[#4CAF50] hover:bg-[#43A047] text-white"
              data-testid="add-sterilisation-button"
            >
              <Plus size={20} />
              <span className="ml-2">Add Record</span>
            </Button>
          </div>

          {sterilisations.length === 0 ? (
            <div className="bg-white border border-[#E7E5E4] rounded-lg p-8 text-center">
              <Syringe size={48} className="mx-auto text-[#D6D3D1]" />
              <p className="text-[#57534E] mt-4">No sterilisation records yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {sterilisations.map((steril) => (
                <div key={steril.id} className="bg-white border border-[#E7E5E4] rounded-lg p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-semibold text-[#1C1917]">
                        {formatDate(steril.sterilisation_date)}
                      </p>
                      <p className="text-sm text-[#57534E]">
                        {steril.gender} • {steril.location} • By {steril.vet_name}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs px-2 py-1 bg-[#E8F5E9] text-[#1B5E20] rounded font-medium">
                        Completed
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openEditSteril(steril)}
                        className="h-8"
                        data-testid={`edit-steril-${steril.id}`}
                      >
                        <PencilSimple size={16} />
                      </Button>
                    </div>
                  </div>
                  {steril.notes && (
                    <p className="mt-3 text-sm text-[#57534E] bg-[#F5F5F4] rounded p-3">
                      {steril.notes}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Media Tab */}
        <TabsContent value="media" className="mt-4 space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold text-[#1C1917]" style={{ fontFamily: 'Manrope' }}>
              Photos & Videos
            </h3>
            <div className="flex gap-2">
              <Button
                onClick={() => { setUploadType("image"); setShowUploadDialog(true); }}
                className="h-12 bg-[#4CAF50] hover:bg-[#43A047] text-white"
                data-testid="upload-image-button"
              >
                <Camera size={20} />
                <span className="ml-2 hidden sm:inline">Upload Photo</span>
              </Button>
              <Button
                onClick={() => { setUploadType("video"); setShowUploadDialog(true); }}
                variant="outline"
                className="h-12 border-2"
                data-testid="upload-video-button"
              >
                <VideoCamera size={20} />
                <span className="ml-2 hidden sm:inline">Upload Video</span>
              </Button>
            </div>
          </div>

          {caseData.images?.length === 0 && caseData.videos?.length === 0 ? (
            <div className="bg-white border border-[#E7E5E4] rounded-lg p-8 text-center">
              <Camera size={48} className="mx-auto text-[#D6D3D1]" />
              <p className="text-[#57534E] mt-4">No media uploaded yet</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Images */}
              {caseData.images?.length > 0 && (
                <div>
                  <h4 className="font-medium text-[#57534E] mb-3">Photos ({caseData.images.length})</h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                    {caseData.images.map((img, idx) => (
                      <div key={img.id || idx} className="bg-white border border-[#E7E5E4] rounded-lg overflow-hidden">
                        <div className="aspect-square bg-[#F5F5F4] relative">
                          <img 
                            src={getImageUrl(img.storage_path)} 
                            alt={img.description || `Image ${idx + 1}`}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.target.style.display = 'none';
                              e.target.nextSibling.style.display = 'flex';
                            }}
                          />
                          <div className="absolute inset-0 flex items-center justify-center text-[#78716C] hidden">
                            <Camera size={32} />
                          </div>
                        </div>
                        <div className="p-2">
                          <p className="text-sm font-medium text-[#1C1917] truncate">{img.description || "No description"}</p>
                          <p className="text-xs text-[#78716C]">{formatTimestamp(img.uploaded_at)}</p>
                          {img.uploaded_by_name && (
                            <p className="text-xs text-[#A8A29E]">by {img.uploaded_by_name}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Videos */}
              {caseData.videos?.length > 0 && (
                <div>
                  <h4 className="font-medium text-[#57534E] mb-3">Videos ({caseData.videos.length})</h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                    {caseData.videos.map((vid, idx) => (
                      <div key={vid.id || idx} className="bg-white border border-[#E7E5E4] rounded-lg overflow-hidden">
                        <div className="aspect-square bg-[#F5F5F4] flex items-center justify-center">
                          <VideoCamera size={48} className="text-[#78716C]" />
                        </div>
                        <div className="p-2">
                          <p className="text-sm font-medium text-[#1C1917] truncate">{vid.description || "No description"}</p>
                          <p className="text-xs text-[#78716C]">{formatTimestamp(vid.uploaded_at)}</p>
                          {vid.uploaded_by_name && (
                            <p className="text-xs text-[#A8A29E]">by {vid.uploaded_by_name}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </TabsContent>

        {/* Notes Tab */}
        <TabsContent value="notes" className="mt-4 space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold text-[#1C1917]" style={{ fontFamily: 'Manrope' }}>
              Special Notes
            </h3>
            <Button
              onClick={() => setShowNoteDialog(true)}
              className="h-12 bg-[#4CAF50] hover:bg-[#43A047] text-white"
              data-testid="add-note-button"
            >
              <Plus size={20} />
              <span className="ml-2">Add Note</span>
            </Button>
          </div>

          {specialNotes.length === 0 ? (
            <div className="bg-white border border-[#E7E5E4] rounded-lg p-8 text-center">
              <Note size={48} className="mx-auto text-[#D6D3D1]" />
              <p className="text-[#57534E] mt-4">No special notes yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {specialNotes.map((note) => (
                <div key={note.id} className="bg-white border border-[#E7E5E4] rounded-lg p-4">
                  <p className="text-sm text-[#57534E]">{formatTimestamp(note.created_at)}</p>
                  <p className="mt-2 text-[#1C1917]">{note.note}</p>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Activity Tab */}
        <TabsContent value="activity" className="mt-4 space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold text-[#1C1917]" style={{ fontFamily: 'Manrope' }}>
              Movement History
            </h3>
            <Button
              onClick={() => setShowMovementDialog(true)}
              className="h-12 bg-[#4CAF50] hover:bg-[#43A047] text-white"
              data-testid="add-movement-button"
            >
              <Plus size={20} />
              <span className="ml-2">Record Movement</span>
            </Button>
          </div>

          {movements.length === 0 ? (
            <div className="bg-white border border-[#E7E5E4] rounded-lg p-8 text-center">
              <ClockCounterClockwise size={48} className="mx-auto text-[#D6D3D1]" />
              <p className="text-[#57534E] mt-4">No movement history recorded</p>
            </div>
          ) : (
            <div className="space-y-3">
              {movements.map((movement) => (
                <div key={movement.id} className="bg-white border border-[#E7E5E4] rounded-lg p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#E8F5E9] flex items-center justify-center">
                      <House size={20} className="text-[#4CAF50]" />
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-[#1C1917]">
                        {movement.from_location} → {movement.to_location}
                      </p>
                      <p className="text-sm text-[#57534E]">
                        {formatDate(movement.date)} • {movement.reason === "Others" ? movement.custom_reason : movement.reason}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Case Timeline */}
          <div className="bg-white border border-[#E7E5E4] rounded-lg p-5">
            <h4 className="font-semibold text-[#1C1917] mb-4">Case Timeline</h4>
            <div className="space-y-4">
              <TimelineItem
                date={caseData.created_at}
                title="Case Created"
                description={`Rescued from ${caseData.rescue_location}${caseData.created_by_name ? ` by ${caseData.created_by_name}` : ''}`}
              />
              {movements.map((m) => (
                <TimelineItem
                  key={m.id}
                  date={m.created_at}
                  title="Moved"
                  description={`${m.from_location} → ${m.to_location}`}
                />
              ))}
              {vetCheckups.map((v) => (
                <TimelineItem
                  key={v.id}
                  date={v.created_at}
                  title="Vet Checkup"
                  description={`By ${v.vet_name}`}
                />
              ))}
              {sterilisations.map((s) => (
                <TimelineItem
                  key={s.id}
                  date={s.created_at}
                  title="Sterilisation"
                  description={`At ${s.location}`}
                />
              ))}
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Vet Checkup Dialog */}
      <VetCheckupDialog
        open={showVetDialog}
        onClose={() => setShowVetDialog(false)}
        caseId={id}
        token={token}
        vetNames={vetNames}
        onSuccess={fetchAllData}
      />

      {/* Edit Vet Checkup Dialog */}
      <EditVetCheckupDialog
        open={showEditVetDialog}
        onClose={() => { setShowEditVetDialog(false); setEditingCheckup(null); }}
        checkup={editingCheckup}
        token={token}
        vetNames={vetNames}
        onSuccess={fetchAllData}
      />

      {/* Sterilisation Dialog */}
      <SterilisationDialog
        open={showSterilDialog}
        onClose={() => setShowSterilDialog(false)}
        caseId={id}
        token={token}
        vetNames={vetNames}
        locations={sterilLocations}
        onSuccess={fetchAllData}
      />

      {/* Edit Sterilisation Dialog */}
      <EditSterilisationDialog
        open={showEditSterilDialog}
        onClose={() => { setShowEditSterilDialog(false); setEditingSteril(null); }}
        sterilisation={editingSteril}
        token={token}
        vetNames={vetNames}
        locations={sterilLocations}
        onSuccess={fetchAllData}
      />

      {/* Movement Dialog */}
      <MovementDialog
        open={showMovementDialog}
        onClose={() => setShowMovementDialog(false)}
        caseId={id}
        token={token}
        onSuccess={fetchAllData}
      />

      {/* Upload Dialog */}
      <UploadDialog
        open={showUploadDialog}
        onClose={() => setShowUploadDialog(false)}
        type={uploadType}
        onUpload={handleUpload}
      />

      {/* Special Note Dialog */}
      <SpecialNoteDialog
        open={showNoteDialog}
        onClose={() => setShowNoteDialog(false)}
        caseId={id}
        token={token}
        onSuccess={fetchAllData}
      />
    </div>
  );
};

const InfoRow = ({ label, value }) => (
  <div className="flex justify-between items-start">
    <span className="text-sm text-[#57534E]">{label}</span>
    <span className="text-sm font-medium text-[#1C1917] text-right max-w-[60%]">{value}</span>
  </div>
);

const TimelineItem = ({ date, title, description }) => (
  <div className="flex gap-3">
    <div className="flex flex-col items-center">
      <div className="w-3 h-3 rounded-full bg-[#4CAF50]"></div>
      <div className="w-0.5 flex-1 bg-[#E7E5E4]"></div>
    </div>
    <div className="pb-4">
      <p className="text-xs text-[#78716C]">{formatTimestamp(date)}</p>
      <p className="font-medium text-[#1C1917]">{title}</p>
      <p className="text-sm text-[#57534E]">{description}</p>
    </div>
  </div>
);

// Dialogs
const VetCheckupDialog = ({ open, onClose, caseId, token, vetNames, onSuccess }) => {
  const [form, setForm] = useState({
    checkup_date: new Date().toISOString().split("T")[0],
    vet_name: "",
    notes: "",
    next_followup_date: ""
  });
  const [prescription, setPrescription] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.vet_name) {
      toast.error("Vet name is required");
      return;
    }
    setLoading(true);
    try {
      const response = await axios.post(`${API}/vet-checkups`, {
        case_id: caseId,
        ...form
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      // Upload prescription if provided
      if (prescription) {
        const formData = new FormData();
        formData.append("file", prescription);
        await axios.post(`${API}/vet-checkups/${response.data.id}/prescription`, formData, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data"
          }
        });
      }

      toast.success("Vet checkup added successfully");
      onSuccess();
      onClose();
      setForm({ checkup_date: new Date().toISOString().split("T")[0], vet_name: "", notes: "", next_followup_date: "" });
      setPrescription(null);
    } catch (error) {
      toast.error("Failed to add vet checkup");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle style={{ fontFamily: 'Manrope' }}>Add Vet Checkup</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label className="text-xs font-bold uppercase tracking-wider text-[#57534E]">Checkup Date</Label>
            <Input
              type="date"
              value={form.checkup_date}
              onChange={(e) => setForm({ ...form, checkup_date: e.target.value })}
              className="h-12 mt-1"
            />
          </div>
          <div>
            <Label className="text-xs font-bold uppercase tracking-wider text-[#57534E]">Vet Name *</Label>
            {vetNames.length > 0 ? (
              <Select value={form.vet_name} onValueChange={(v) => setForm({ ...form, vet_name: v })}>
                <SelectTrigger className="h-12 mt-1">
                  <SelectValue placeholder="Select vet" />
                </SelectTrigger>
                <SelectContent>
                  {vetNames.map((vet) => (
                    <SelectItem key={vet.id} value={vet.name}>{vet.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <Input
                value={form.vet_name}
                onChange={(e) => setForm({ ...form, vet_name: e.target.value })}
                placeholder="Enter vet name"
                className="h-12 mt-1"
              />
            )}
          </div>
          <div>
            <Label className="text-xs font-bold uppercase tracking-wider text-[#57534E]">Notes</Label>
            <Textarea
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              placeholder="Enter checkup notes..."
              className="mt-1"
              rows={3}
            />
          </div>
          <div>
            <Label className="text-xs font-bold uppercase tracking-wider text-[#57534E]">Next Follow-up Date</Label>
            <Input
              type="date"
              value={form.next_followup_date}
              onChange={(e) => setForm({ ...form, next_followup_date: e.target.value })}
              className="h-12 mt-1"
            />
          </div>
          <div>
            <Label className="text-xs font-bold uppercase tracking-wider text-[#57534E]">Prescription (Optional)</Label>
            <div className="mt-1 flex items-center gap-3">
              <Input
                type="file"
                accept="image/*,.pdf"
                onChange={(e) => setPrescription(e.target.files[0])}
                className="h-12"
              />
              {prescription && (
                <span className="text-sm text-[#4CAF50]">{prescription.name}</span>
              )}
            </div>
          </div>
          <div className="flex gap-3">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1 h-12">
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="flex-1 h-12 bg-[#4CAF50] hover:bg-[#43A047] text-white">
              {loading ? "Saving..." : "Save"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

const EditVetCheckupDialog = ({ open, onClose, checkup, token, vetNames, onSuccess }) => {
  const [form, setForm] = useState({
    checkup_date: "",
    vet_name: "",
    notes: "",
    next_followup_date: "",
    followup_completed: false
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (checkup) {
      setForm({
        checkup_date: checkup.checkup_date || "",
        vet_name: checkup.vet_name || "",
        notes: checkup.notes || "",
        next_followup_date: checkup.next_followup_date || "",
        followup_completed: checkup.followup_completed || false
      });
    }
  }, [checkup]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!checkup) return;
    
    setLoading(true);
    try {
      await axios.put(`${API}/vet-checkups/${checkup.id}`, form, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success("Checkup updated successfully");
      onSuccess();
      onClose();
    } catch (error) {
      toast.error("Failed to update checkup");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle style={{ fontFamily: 'Manrope' }}>Edit Vet Checkup</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label className="text-xs font-bold uppercase tracking-wider text-[#57534E]">Checkup Date</Label>
            <Input
              type="date"
              value={form.checkup_date}
              onChange={(e) => setForm({ ...form, checkup_date: e.target.value })}
              className="h-12 mt-1"
            />
          </div>
          <div>
            <Label className="text-xs font-bold uppercase tracking-wider text-[#57534E]">Vet Name</Label>
            {vetNames.length > 0 ? (
              <Select value={form.vet_name} onValueChange={(v) => setForm({ ...form, vet_name: v })}>
                <SelectTrigger className="h-12 mt-1">
                  <SelectValue placeholder="Select vet" />
                </SelectTrigger>
                <SelectContent>
                  {vetNames.map((vet) => (
                    <SelectItem key={vet.id} value={vet.name}>{vet.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <Input
                value={form.vet_name}
                onChange={(e) => setForm({ ...form, vet_name: e.target.value })}
                className="h-12 mt-1"
              />
            )}
          </div>
          <div>
            <Label className="text-xs font-bold uppercase tracking-wider text-[#57534E]">Notes</Label>
            <Textarea
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              className="mt-1"
              rows={3}
            />
          </div>
          <div>
            <Label className="text-xs font-bold uppercase tracking-wider text-[#57534E]">Next Follow-up Date</Label>
            <Input
              type="date"
              value={form.next_followup_date}
              onChange={(e) => setForm({ ...form, next_followup_date: e.target.value })}
              className="h-12 mt-1"
            />
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="followup_completed"
              checked={form.followup_completed}
              onChange={(e) => setForm({ ...form, followup_completed: e.target.checked })}
              className="w-5 h-5"
            />
            <Label htmlFor="followup_completed" className="text-sm">Follow-up completed</Label>
          </div>
          <div className="flex gap-3">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1 h-12">
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="flex-1 h-12 bg-[#4CAF50] hover:bg-[#43A047] text-white">
              {loading ? "Saving..." : "Update"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

const SterilisationDialog = ({ open, onClose, caseId, token, vetNames, locations, onSuccess }) => {
  const [form, setForm] = useState({
    sterilisation_date: new Date().toISOString().split("T")[0],
    gender: "",
    location: "",
    vet_name: "",
    notes: ""
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.gender || !form.location || !form.vet_name) {
      toast.error("Please fill all required fields");
      return;
    }
    setLoading(true);
    try {
      await axios.post(`${API}/sterilisations`, {
        case_id: caseId,
        ...form
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success("Sterilisation record added");
      onSuccess();
      onClose();
      setForm({ sterilisation_date: new Date().toISOString().split("T")[0], gender: "", location: "", vet_name: "", notes: "" });
    } catch (error) {
      toast.error("Failed to add sterilisation record");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle style={{ fontFamily: 'Manrope' }}>Add Sterilisation Record</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label className="text-xs font-bold uppercase tracking-wider text-[#57534E]">Date</Label>
            <Input
              type="date"
              value={form.sterilisation_date}
              onChange={(e) => setForm({ ...form, sterilisation_date: e.target.value })}
              className="h-12 mt-1"
            />
          </div>
          <div>
            <Label className="text-xs font-bold uppercase tracking-wider text-[#57534E]">Gender *</Label>
            <Select value={form.gender} onValueChange={(v) => setForm({ ...form, gender: v })}>
              <SelectTrigger className="h-12 mt-1">
                <SelectValue placeholder="Select gender" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Male">Male</SelectItem>
                <SelectItem value="Female">Female</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs font-bold uppercase tracking-wider text-[#57534E]">Location *</Label>
            {locations.length > 0 ? (
              <Select value={form.location} onValueChange={(v) => setForm({ ...form, location: v })}>
                <SelectTrigger className="h-12 mt-1">
                  <SelectValue placeholder="Select location" />
                </SelectTrigger>
                <SelectContent>
                  {locations.map((loc) => (
                    <SelectItem key={loc.id} value={loc.name}>{loc.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <Select value={form.location} onValueChange={(v) => setForm({ ...form, location: v })}>
                <SelectTrigger className="h-12 mt-1">
                  <SelectValue placeholder="Select location" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="SEVA Shelter">SEVA Shelter</SelectItem>
                  <SelectItem value="Government Clinic">Government Clinic</SelectItem>
                  <SelectItem value="Private Clinic">Private Clinic</SelectItem>
                </SelectContent>
              </Select>
            )}
          </div>
          <div>
            <Label className="text-xs font-bold uppercase tracking-wider text-[#57534E]">Vet Name *</Label>
            {vetNames.length > 0 ? (
              <Select value={form.vet_name} onValueChange={(v) => setForm({ ...form, vet_name: v })}>
                <SelectTrigger className="h-12 mt-1">
                  <SelectValue placeholder="Select vet" />
                </SelectTrigger>
                <SelectContent>
                  {vetNames.map((vet) => (
                    <SelectItem key={vet.id} value={vet.name}>{vet.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <Input
                value={form.vet_name}
                onChange={(e) => setForm({ ...form, vet_name: e.target.value })}
                placeholder="Enter vet name"
                className="h-12 mt-1"
              />
            )}
          </div>
          <div>
            <Label className="text-xs font-bold uppercase tracking-wider text-[#57534E]">Notes</Label>
            <Textarea
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              placeholder="Enter notes..."
              className="mt-1"
              rows={3}
            />
          </div>
          <div className="flex gap-3">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1 h-12">
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="flex-1 h-12 bg-[#4CAF50] hover:bg-[#43A047] text-white">
              {loading ? "Saving..." : "Save"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

const EditSterilisationDialog = ({ open, onClose, sterilisation, token, vetNames, locations, onSuccess }) => {
  const [form, setForm] = useState({
    sterilisation_date: "",
    gender: "",
    location: "",
    vet_name: "",
    notes: ""
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (sterilisation) {
      setForm({
        sterilisation_date: sterilisation.sterilisation_date || "",
        gender: sterilisation.gender || "",
        location: sterilisation.location || "",
        vet_name: sterilisation.vet_name || "",
        notes: sterilisation.notes || ""
      });
    }
  }, [sterilisation]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!sterilisation) return;
    
    setLoading(true);
    try {
      await axios.put(`${API}/sterilisations/${sterilisation.id}`, form, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success("Sterilisation record updated");
      onSuccess();
      onClose();
    } catch (error) {
      toast.error("Failed to update sterilisation record");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle style={{ fontFamily: 'Manrope' }}>Edit Sterilisation Record</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label className="text-xs font-bold uppercase tracking-wider text-[#57534E]">Date</Label>
            <Input
              type="date"
              value={form.sterilisation_date}
              onChange={(e) => setForm({ ...form, sterilisation_date: e.target.value })}
              className="h-12 mt-1"
            />
          </div>
          <div>
            <Label className="text-xs font-bold uppercase tracking-wider text-[#57534E]">Gender</Label>
            <Select value={form.gender} onValueChange={(v) => setForm({ ...form, gender: v })}>
              <SelectTrigger className="h-12 mt-1">
                <SelectValue placeholder="Select gender" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Male">Male</SelectItem>
                <SelectItem value="Female">Female</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs font-bold uppercase tracking-wider text-[#57534E]">Location</Label>
            {locations.length > 0 ? (
              <Select value={form.location} onValueChange={(v) => setForm({ ...form, location: v })}>
                <SelectTrigger className="h-12 mt-1">
                  <SelectValue placeholder="Select location" />
                </SelectTrigger>
                <SelectContent>
                  {locations.map((loc) => (
                    <SelectItem key={loc.id} value={loc.name}>{loc.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <Input
                value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
                className="h-12 mt-1"
              />
            )}
          </div>
          <div>
            <Label className="text-xs font-bold uppercase tracking-wider text-[#57534E]">Vet Name</Label>
            {vetNames.length > 0 ? (
              <Select value={form.vet_name} onValueChange={(v) => setForm({ ...form, vet_name: v })}>
                <SelectTrigger className="h-12 mt-1">
                  <SelectValue placeholder="Select vet" />
                </SelectTrigger>
                <SelectContent>
                  {vetNames.map((vet) => (
                    <SelectItem key={vet.id} value={vet.name}>{vet.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <Input
                value={form.vet_name}
                onChange={(e) => setForm({ ...form, vet_name: e.target.value })}
                className="h-12 mt-1"
              />
            )}
          </div>
          <div>
            <Label className="text-xs font-bold uppercase tracking-wider text-[#57534E]">Notes</Label>
            <Textarea
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              className="mt-1"
              rows={3}
            />
          </div>
          <div className="flex gap-3">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1 h-12">
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="flex-1 h-12 bg-[#4CAF50] hover:bg-[#43A047] text-white">
              {loading ? "Saving..." : "Update"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

const MovementDialog = ({ open, onClose, caseId, token, onSuccess }) => {
  const [form, setForm] = useState({
    from_location: "",
    to_location: "",
    date: new Date().toISOString().split("T")[0],
    reason: "",
    custom_reason: ""
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.from_location || !form.to_location || !form.reason) {
      toast.error("Please fill all required fields");
      return;
    }
    if (form.reason === "Others" && !form.custom_reason) {
      toast.error("Please enter the reason");
      return;
    }
    setLoading(true);
    try {
      await axios.post(`${API}/movements`, {
        case_id: caseId,
        ...form
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success("Movement recorded");
      onSuccess();
      onClose();
      setForm({ from_location: "", to_location: "", date: new Date().toISOString().split("T")[0], reason: "", custom_reason: "" });
    } catch (error) {
      toast.error("Failed to record movement");
    } finally {
      setLoading(false);
    }
  };

  const locations = ["SEVA Shelter", "Government Shelter", "Private Shelter", "Field Location", "Vet Clinic"];
  const reasons = ["Transfer", "Recovery", "Treatment", "Emergency", "Release", "Others"];

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle style={{ fontFamily: 'Manrope' }}>Record Movement</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label className="text-xs font-bold uppercase tracking-wider text-[#57534E]">From Location *</Label>
            <Select value={form.from_location} onValueChange={(v) => setForm({ ...form, from_location: v })}>
              <SelectTrigger className="h-12 mt-1">
                <SelectValue placeholder="Select location" />
              </SelectTrigger>
              <SelectContent>
                {locations.map((loc) => (
                  <SelectItem key={loc} value={loc}>{loc}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs font-bold uppercase tracking-wider text-[#57534E]">To Location *</Label>
            <Select value={form.to_location} onValueChange={(v) => setForm({ ...form, to_location: v })}>
              <SelectTrigger className="h-12 mt-1">
                <SelectValue placeholder="Select location" />
              </SelectTrigger>
              <SelectContent>
                {locations.map((loc) => (
                  <SelectItem key={loc} value={loc}>{loc}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs font-bold uppercase tracking-wider text-[#57534E]">Date</Label>
            <Input
              type="date"
              value={form.date}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
              className="h-12 mt-1"
            />
          </div>
          <div>
            <Label className="text-xs font-bold uppercase tracking-wider text-[#57534E]">Reason *</Label>
            <Select value={form.reason} onValueChange={(v) => setForm({ ...form, reason: v })}>
              <SelectTrigger className="h-12 mt-1">
                <SelectValue placeholder="Select reason" />
              </SelectTrigger>
              <SelectContent>
                {reasons.map((r) => (
                  <SelectItem key={r} value={r}>{r}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {form.reason === "Others" && (
            <div>
              <Label className="text-xs font-bold uppercase tracking-wider text-[#57534E]">Specify Reason *</Label>
              <Input
                value={form.custom_reason}
                onChange={(e) => setForm({ ...form, custom_reason: e.target.value })}
                placeholder="Enter reason"
                className="h-12 mt-1"
              />
            </div>
          )}
          <div className="flex gap-3">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1 h-12">
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="flex-1 h-12 bg-[#4CAF50] hover:bg-[#43A047] text-white">
              {loading ? "Saving..." : "Save"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

const UploadDialog = ({ open, onClose, type, onUpload }) => {
  const [file, setFile] = useState(null);
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!file) {
      toast.error("Please select a file");
      return;
    }
    if (!description.trim()) {
      toast.error("Please enter a description/note for the file");
      return;
    }
    setLoading(true);
    await onUpload(file, type, description.trim());
    setLoading(false);
    setFile(null);
    setDescription("");
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle style={{ fontFamily: 'Manrope' }}>
            Upload {type === "image" ? "Photo" : "Video"}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="border-2 border-dashed border-[#E7E5E4] rounded-lg p-8 text-center">
            <input
              type="file"
              accept={type === "image" ? "image/*" : "video/*"}
              onChange={(e) => setFile(e.target.files[0])}
              className="hidden"
              id="file-upload"
            />
            <label htmlFor="file-upload" className="cursor-pointer">
              <Upload size={48} className="mx-auto text-[#78716C]" />
              <p className="mt-4 text-sm text-[#57534E]">
                Click to select {type === "image" ? "an image" : "a video"}
              </p>
              {file && (
                <p className="mt-2 text-sm font-medium text-[#4CAF50]">{file.name}</p>
              )}
            </label>
          </div>
          <div>
            <Label className="text-xs font-bold uppercase tracking-wider text-[#57534E]">Description/Note *</Label>
            <Input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g., Blood Test Report, X-ray, Treatment Video"
              className="h-12 mt-1"
            />
            <p className="text-xs text-[#78716C] mt-1">This helps identify the file later</p>
          </div>
          <div className="flex gap-3">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1 h-12">
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={loading || !file || !description.trim()}
              className="flex-1 h-12 bg-[#4CAF50] hover:bg-[#43A047] text-white"
            >
              {loading ? "Uploading..." : "Upload"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

const SpecialNoteDialog = ({ open, onClose, caseId, token, onSuccess }) => {
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!note.trim()) {
      toast.error("Please enter a note");
      return;
    }
    setLoading(true);
    try {
      await axios.post(`${API}/special-notes`, {
        case_id: caseId,
        note: note.trim()
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success("Note added successfully");
      onSuccess();
      onClose();
      setNote("");
    } catch (error) {
      toast.error("Failed to add note");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle style={{ fontFamily: 'Manrope' }}>Add Special Note</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label className="text-xs font-bold uppercase tracking-wider text-[#57534E]">Note</Label>
            <Textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Enter special note for this case..."
              className="mt-1"
              rows={4}
            />
          </div>
          <div className="flex gap-3">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1 h-12">
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="flex-1 h-12 bg-[#4CAF50] hover:bg-[#43A047] text-white">
              {loading ? "Saving..." : "Save"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CaseDetail;

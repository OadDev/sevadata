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
  DialogTitle,
  DialogTrigger
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
  Calendar,
  Phone,
  User,
  House,
  ClockCounterClockwise,
  Upload,
  X,
  FileText,
  PawPrint
} from "@phosphor-icons/react";

const CaseDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { token, isAdmin } = useAuth();
  const [caseData, setCaseData] = useState(null);
  const [vetCheckups, setVetCheckups] = useState([]);
  const [sterilisations, setSterilisations] = useState([]);
  const [movements, setMovements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");

  // Dialogs
  const [showVetDialog, setShowVetDialog] = useState(false);
  const [showSterilDialog, setShowSterilDialog] = useState(false);
  const [showMovementDialog, setShowMovementDialog] = useState(false);
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [uploadType, setUploadType] = useState("image");

  useEffect(() => {
    fetchAllData();
  }, [id]);

  const fetchAllData = async () => {
    try {
      const [caseRes, vetRes, sterilRes, movementRes] = await Promise.all([
        axios.get(`${API}/cases/${id}`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API}/vet-checkups?case_id=${id}`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API}/sterilisations?case_id=${id}`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API}/movements?case_id=${id}`, { headers: { Authorization: `Bearer ${token}` } })
      ]);
      setCaseData(caseRes.data);
      setVetCheckups(vetRes.data);
      setSterilisations(sterilRes.data);
      setMovements(movementRes.data);
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

  const handleUpload = async (file, type) => {
    const formData = new FormData();
    formData.append("file", file);

    try {
      const endpoint = type === "image" ? "images" : "videos";
      await axios.post(`${API}/cases/${id}/${endpoint}`, formData, {
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

  const getConditionClass = (condition) => {
    const classes = {
      Critical: "condition-critical",
      Injured: "condition-injured",
      Sick: "condition-sick",
      Healthy: "condition-healthy"
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
              <span className={`px-2 py-0.5 text-xs font-semibold rounded ${getConditionClass(caseData.condition)}`}>
                {caseData.condition}
              </span>
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

      {/* Status Bar */}
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
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="w-full flex bg-white border border-[#E7E5E4] rounded-lg p-1 h-auto">
          {["overview", "medical", "sterilisation", "media", "activity"].map((tab) => (
            <TabsTrigger
              key={tab}
              value={tab}
              className="flex-1 h-12 data-[state=active]:bg-[#E8F5E9] data-[state=active]:text-[#1B5E20] capitalize font-medium"
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
                <InfoRow label="Condition" value={caseData.condition} />
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
                  label="Date" 
                  value={`${new Date(caseData.rescue_date).toLocaleDateString()} ${caseData.rescue_time || ""}`} 
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
                        {new Date(checkup.checkup_date).toLocaleDateString()}
                      </p>
                      <p className="text-sm text-[#57534E]">By {checkup.vet_name}</p>
                    </div>
                    {checkup.next_followup_date && (
                      <span className="text-xs px-2 py-1 bg-[#FEF3C7] text-[#92400E] rounded">
                        Follow-up: {new Date(checkup.next_followup_date).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                  {checkup.notes && (
                    <p className="mt-3 text-sm text-[#57534E] bg-[#F5F5F4] rounded p-3">
                      {checkup.notes}
                    </p>
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
                        {new Date(steril.sterilisation_date).toLocaleDateString()}
                      </p>
                      <p className="text-sm text-[#57534E]">
                        {steril.gender} • {steril.location} • By {steril.vet_name}
                      </p>
                    </div>
                    <span className="text-xs px-2 py-1 bg-[#E8F5E9] text-[#1B5E20] rounded font-medium">
                      Completed
                    </span>
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
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {caseData.images?.map((img, idx) => (
                <div key={img.id || idx} className="aspect-square bg-[#F5F5F4] rounded-lg flex items-center justify-center border border-[#E7E5E4]">
                  <div className="text-center">
                    <Camera size={32} className="mx-auto text-[#78716C]" />
                    <p className="text-xs text-[#78716C] mt-2">{img.original_filename || `Image ${idx + 1}`}</p>
                  </div>
                </div>
              ))}
              {caseData.videos?.map((vid, idx) => (
                <div key={vid.id || idx} className="aspect-square bg-[#F5F5F4] rounded-lg flex items-center justify-center border border-[#E7E5E4]">
                  <div className="text-center">
                    <VideoCamera size={32} className="mx-auto text-[#78716C]" />
                    <p className="text-xs text-[#78716C] mt-2">{vid.original_filename || `Video ${idx + 1}`}</p>
                  </div>
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
                        {new Date(movement.date).toLocaleDateString()} • {movement.reason}
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
                description={`Rescued from ${caseData.rescue_location}`}
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
        onSuccess={fetchAllData}
      />

      {/* Sterilisation Dialog */}
      <SterilisationDialog
        open={showSterilDialog}
        onClose={() => setShowSterilDialog(false)}
        caseId={id}
        token={token}
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
      <p className="text-xs text-[#78716C]">{new Date(date).toLocaleString()}</p>
      <p className="font-medium text-[#1C1917]">{title}</p>
      <p className="text-sm text-[#57534E]">{description}</p>
    </div>
  </div>
);

// Dialogs
const VetCheckupDialog = ({ open, onClose, caseId, token, onSuccess }) => {
  const [form, setForm] = useState({
    checkup_date: new Date().toISOString().split("T")[0],
    vet_name: "",
    notes: "",
    next_followup_date: ""
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.vet_name) {
      toast.error("Vet name is required");
      return;
    }
    setLoading(true);
    try {
      await axios.post(`${API}/vet-checkups`, {
        case_id: caseId,
        ...form
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success("Vet checkup added successfully");
      onSuccess();
      onClose();
      setForm({ checkup_date: new Date().toISOString().split("T")[0], vet_name: "", notes: "", next_followup_date: "" });
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
              data-testid="vet-checkup-date"
            />
          </div>
          <div>
            <Label className="text-xs font-bold uppercase tracking-wider text-[#57534E]">Vet Name *</Label>
            <Input
              value={form.vet_name}
              onChange={(e) => setForm({ ...form, vet_name: e.target.value })}
              placeholder="Enter vet name"
              className="h-12 mt-1"
              data-testid="vet-checkup-vet-name"
            />
          </div>
          <div>
            <Label className="text-xs font-bold uppercase tracking-wider text-[#57534E]">Notes</Label>
            <Textarea
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              placeholder="Enter checkup notes..."
              className="mt-1"
              rows={3}
              data-testid="vet-checkup-notes"
            />
          </div>
          <div>
            <Label className="text-xs font-bold uppercase tracking-wider text-[#57534E]">Next Follow-up Date</Label>
            <Input
              type="date"
              value={form.next_followup_date}
              onChange={(e) => setForm({ ...form, next_followup_date: e.target.value })}
              className="h-12 mt-1"
              data-testid="vet-checkup-followup-date"
            />
          </div>
          <div className="flex gap-3">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1 h-12">
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="flex-1 h-12 bg-[#4CAF50] hover:bg-[#43A047] text-white" data-testid="vet-checkup-submit">
              {loading ? "Saving..." : "Save"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

const SterilisationDialog = ({ open, onClose, caseId, token, onSuccess }) => {
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
              data-testid="sterilisation-date"
            />
          </div>
          <div>
            <Label className="text-xs font-bold uppercase tracking-wider text-[#57534E]">Gender *</Label>
            <Select value={form.gender} onValueChange={(v) => setForm({ ...form, gender: v })}>
              <SelectTrigger className="h-12 mt-1" data-testid="sterilisation-gender">
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
            <Select value={form.location} onValueChange={(v) => setForm({ ...form, location: v })}>
              <SelectTrigger className="h-12 mt-1" data-testid="sterilisation-location">
                <SelectValue placeholder="Select location" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="SEVA Shelter">SEVA Shelter</SelectItem>
                <SelectItem value="Government Clinic">Government Clinic</SelectItem>
                <SelectItem value="Private Clinic">Private Clinic</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs font-bold uppercase tracking-wider text-[#57534E]">Vet Name *</Label>
            <Input
              value={form.vet_name}
              onChange={(e) => setForm({ ...form, vet_name: e.target.value })}
              placeholder="Enter vet name"
              className="h-12 mt-1"
              data-testid="sterilisation-vet-name"
            />
          </div>
          <div>
            <Label className="text-xs font-bold uppercase tracking-wider text-[#57534E]">Notes</Label>
            <Textarea
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              placeholder="Enter notes..."
              className="mt-1"
              rows={3}
              data-testid="sterilisation-notes"
            />
          </div>
          <div className="flex gap-3">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1 h-12">
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="flex-1 h-12 bg-[#4CAF50] hover:bg-[#43A047] text-white" data-testid="sterilisation-submit">
              {loading ? "Saving..." : "Save"}
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
    reason: ""
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.from_location || !form.to_location || !form.reason) {
      toast.error("Please fill all required fields");
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
      setForm({ from_location: "", to_location: "", date: new Date().toISOString().split("T")[0], reason: "" });
    } catch (error) {
      toast.error("Failed to record movement");
    } finally {
      setLoading(false);
    }
  };

  const locations = ["SEVA Shelter", "Government Shelter", "Private Shelter", "Field Location", "Vet Clinic"];

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
              <SelectTrigger className="h-12 mt-1" data-testid="movement-from">
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
              <SelectTrigger className="h-12 mt-1" data-testid="movement-to">
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
              data-testid="movement-date"
            />
          </div>
          <div>
            <Label className="text-xs font-bold uppercase tracking-wider text-[#57534E]">Reason *</Label>
            <Select value={form.reason} onValueChange={(v) => setForm({ ...form, reason: v })}>
              <SelectTrigger className="h-12 mt-1" data-testid="movement-reason">
                <SelectValue placeholder="Select reason" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Transfer">Transfer</SelectItem>
                <SelectItem value="Recovery">Recovery</SelectItem>
                <SelectItem value="Treatment">Treatment</SelectItem>
                <SelectItem value="Emergency">Emergency</SelectItem>
                <SelectItem value="Release">Release</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex gap-3">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1 h-12">
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="flex-1 h-12 bg-[#4CAF50] hover:bg-[#43A047] text-white" data-testid="movement-submit">
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
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!file) {
      toast.error("Please select a file");
      return;
    }
    setLoading(true);
    await onUpload(file, type);
    setLoading(false);
    setFile(null);
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
              data-testid="file-upload-input"
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
          <div className="flex gap-3">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1 h-12">
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={loading || !file}
              className="flex-1 h-12 bg-[#4CAF50] hover:bg-[#43A047] text-white"
              data-testid="upload-submit"
            >
              {loading ? "Uploading..." : "Upload"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CaseDetail;

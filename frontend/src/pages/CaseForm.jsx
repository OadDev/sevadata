import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
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
import {
  ArrowLeft,
  PawPrint,
  MapPin,
  User,
  FirstAid,
  Camera,
  VideoCamera,
  X,
  Upload
} from "@phosphor-icons/react";

const CaseForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { token } = useAuth();
  const isEditing = Boolean(id);

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(isEditing);
  const [uploadingMedia, setUploadingMedia] = useState(false);
  const [pendingImages, setPendingImages] = useState([]);
  const [pendingVideos, setPendingVideos] = useState([]);
  const [form, setForm] = useState({
    animal_name: "",
    animal_type: "Dog",
    gender: "",
    age: "",
    rescue_date: new Date().toISOString().split("T")[0],
    rescue_time: "",
    rescue_location: "",
    area: "",
    reporter_name: "",
    reporter_contact: "",
    condition: "",
    condition_notes: "",
    case_type: "Rescue Case",
    status: "Rescued (Status Pending)",
    current_shelter: "",
    arrival_date_seva: "",
    sterilisation_status: "Not Required"
  });

  useEffect(() => {
    if (isEditing) {
      fetchCase();
    }
  }, [id]);

  const fetchCase = async () => {
    try {
      const response = await axios.get(`${API}/cases/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setForm(response.data);
    } catch (error) {
      toast.error("Failed to load case");
      navigate("/cases");
    } finally {
      setFetching(false);
    }
  };

  const handleImageSelect = (e) => {
    const files = Array.from(e.target.files);
    setPendingImages([...pendingImages, ...files]);
  };

  const handleVideoSelect = (e) => {
    const files = Array.from(e.target.files);
    setPendingVideos([...pendingVideos, ...files]);
  };

  const removeImage = (index) => {
    setPendingImages(pendingImages.filter((_, i) => i !== index));
  };

  const removeVideo = (index) => {
    setPendingVideos(pendingVideos.filter((_, i) => i !== index));
  };

  const uploadMedia = async (caseId) => {
    // Upload images
    for (const file of pendingImages) {
      const formData = new FormData();
      formData.append("file", file);
      await axios.post(`${API}/cases/${caseId}/images`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data"
        }
      });
    }
    
    // Upload videos
    for (const file of pendingVideos) {
      const formData = new FormData();
      formData.append("file", file);
      await axios.post(`${API}/cases/${caseId}/videos`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data"
        }
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!form.animal_type || !form.rescue_date || !form.rescue_location) {
      toast.error("Please fill all required fields");
      return;
    }

    setLoading(true);
    try {
      let caseId = id;
      
      if (isEditing) {
        await axios.put(`${API}/cases/${id}`, form, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success("Case updated successfully");
      } else {
        const response = await axios.post(`${API}/cases`, form, {
          headers: { Authorization: `Bearer ${token}` }
        });
        caseId = response.data.id;
        toast.success("Case created successfully");
      }

      // Upload any pending media
      if (pendingImages.length > 0 || pendingVideos.length > 0) {
        setUploadingMedia(true);
        try {
          await uploadMedia(caseId);
          toast.success("Media uploaded successfully");
        } catch (error) {
          toast.error("Some media failed to upload");
        }
        setUploadingMedia(false);
      }

      navigate(`/cases/${caseId}`);
    } catch (error) {
      toast.error(isEditing ? "Failed to update case" : "Failed to create case");
    } finally {
      setLoading(false);
    }
  };

  const updateField = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const isSterilisationOnly = form.case_type === "Sterilisation Only Case";

  const conditions = [
    "Accident",
    "Cancer",
    "Injury",
    "Sick",
    "Critical",
    "Canine Distemper",
    "Parvo Virus",
    "Not Sure"
  ];

  const statuses = [
    "Rescued (Status Pending)",
    "Released",
    "Permanent Resident",
    "Adopted",
    "Deceased"
  ];

  if (fetching) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#4CAF50] border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate(-1)}
          className="p-2 rounded-lg hover:bg-[#F5F5F4] text-[#57534E]"
          data-testid="back-button"
        >
          <ArrowLeft size={24} />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-[#1C1917]" style={{ fontFamily: 'Manrope' }}>
            {isEditing ? "Edit Case" : "New Case"}
          </h1>
          <p className="text-[#57534E] text-sm mt-0.5">
            {isEditing ? "Update case information" : "Create a new rescue case"}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Animal Information */}
        <div className="bg-white border border-[#E7E5E4] rounded-lg p-5">
          <h2 className="text-lg font-semibold text-[#1C1917] mb-4 flex items-center gap-2" style={{ fontFamily: 'Manrope' }}>
            <PawPrint size={22} className="text-[#4CAF50]" />
            Animal Information
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label className="text-xs font-bold uppercase tracking-wider text-[#57534E]">
                Animal Name
              </Label>
              <Input
                value={form.animal_name}
                onChange={(e) => updateField("animal_name", e.target.value)}
                placeholder="Optional"
                className="h-12 mt-1 bg-[#F5F5F4] border-2 border-[#E7E5E4] focus:border-[#4CAF50]"
                data-testid="animal-name-input"
              />
            </div>
            <div>
              <Label className="text-xs font-bold uppercase tracking-wider text-[#57534E]">
                Animal Type *
              </Label>
              <Select value={form.animal_type} onValueChange={(v) => updateField("animal_type", v)}>
                <SelectTrigger className="h-12 mt-1" data-testid="animal-type-select">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Dog">Dog</SelectItem>
                  <SelectItem value="Cat">Cat</SelectItem>
                  <SelectItem value="Bird">Bird</SelectItem>
                  <SelectItem value="Cow">Cow</SelectItem>
                  <SelectItem value="Goat">Goat</SelectItem>
                  <SelectItem value="Horse">Horse</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs font-bold uppercase tracking-wider text-[#57534E]">
                Gender
              </Label>
              <Select value={form.gender || ""} onValueChange={(v) => updateField("gender", v)}>
                <SelectTrigger className="h-12 mt-1" data-testid="gender-select">
                  <SelectValue placeholder="Select gender" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Male">Male</SelectItem>
                  <SelectItem value="Female">Female</SelectItem>
                  <SelectItem value="Unknown">Unknown</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs font-bold uppercase tracking-wider text-[#57534E]">
                Age
              </Label>
              <Input
                value={form.age}
                onChange={(e) => updateField("age", e.target.value)}
                placeholder="e.g., 2 years, 6 months"
                className="h-12 mt-1 bg-[#F5F5F4] border-2 border-[#E7E5E4] focus:border-[#4CAF50]"
                data-testid="age-input"
              />
            </div>
          </div>
        </div>

        {/* Rescue Details */}
        <div className="bg-white border border-[#E7E5E4] rounded-lg p-5">
          <h2 className="text-lg font-semibold text-[#1C1917] mb-4 flex items-center gap-2" style={{ fontFamily: 'Manrope' }}>
            <MapPin size={22} className="text-[#4CAF50]" />
            Rescue Details
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label className="text-xs font-bold uppercase tracking-wider text-[#57534E]">
                Rescue Date *
              </Label>
              <Input
                type="date"
                value={form.rescue_date}
                onChange={(e) => updateField("rescue_date", e.target.value)}
                className="h-12 mt-1 bg-[#F5F5F4] border-2 border-[#E7E5E4] focus:border-[#4CAF50]"
                data-testid="rescue-date-input"
              />
            </div>
            <div>
              <Label className="text-xs font-bold uppercase tracking-wider text-[#57534E]">
                Rescue Time
              </Label>
              <Input
                type="time"
                value={form.rescue_time}
                onChange={(e) => updateField("rescue_time", e.target.value)}
                className="h-12 mt-1 bg-[#F5F5F4] border-2 border-[#E7E5E4] focus:border-[#4CAF50]"
                data-testid="rescue-time-input"
              />
            </div>
            <div className="sm:col-span-2">
              <Label className="text-xs font-bold uppercase tracking-wider text-[#57534E]">
                Rescue Location *
              </Label>
              <Input
                value={form.rescue_location}
                onChange={(e) => updateField("rescue_location", e.target.value)}
                placeholder="Enter full address or landmark"
                className="h-12 mt-1 bg-[#F5F5F4] border-2 border-[#E7E5E4] focus:border-[#4CAF50]"
                data-testid="rescue-location-input"
              />
            </div>
            <div>
              <Label className="text-xs font-bold uppercase tracking-wider text-[#57534E]">
                Area
              </Label>
              <Input
                value={form.area}
                onChange={(e) => updateField("area", e.target.value)}
                placeholder="e.g., Koramangala, HSR Layout"
                className="h-12 mt-1 bg-[#F5F5F4] border-2 border-[#E7E5E4] focus:border-[#4CAF50]"
                data-testid="area-input"
              />
            </div>
          </div>
        </div>

        {/* Reporter Information */}
        <div className="bg-white border border-[#E7E5E4] rounded-lg p-5">
          <h2 className="text-lg font-semibold text-[#1C1917] mb-4 flex items-center gap-2" style={{ fontFamily: 'Manrope' }}>
            <User size={22} className="text-[#4CAF50]" />
            Reporter Information
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label className="text-xs font-bold uppercase tracking-wider text-[#57534E]">
                Reporter Name
              </Label>
              <Input
                value={form.reporter_name}
                onChange={(e) => updateField("reporter_name", e.target.value)}
                placeholder="Who reported this case?"
                className="h-12 mt-1 bg-[#F5F5F4] border-2 border-[#E7E5E4] focus:border-[#4CAF50]"
                data-testid="reporter-name-input"
              />
            </div>
            <div>
              <Label className="text-xs font-bold uppercase tracking-wider text-[#57534E]">
                Contact Number
              </Label>
              <Input
                value={form.reporter_contact}
                onChange={(e) => updateField("reporter_contact", e.target.value)}
                placeholder="Phone number"
                className="h-12 mt-1 bg-[#F5F5F4] border-2 border-[#E7E5E4] focus:border-[#4CAF50]"
                data-testid="reporter-contact-input"
              />
            </div>
          </div>
        </div>

        {/* Case Status */}
        <div className="bg-white border border-[#E7E5E4] rounded-lg p-5">
          <h2 className="text-lg font-semibold text-[#1C1917] mb-4 flex items-center gap-2" style={{ fontFamily: 'Manrope' }}>
            <FirstAid size={22} className="text-[#4CAF50]" />
            Case Status
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Case Type comes BEFORE Condition */}
            <div>
              <Label className="text-xs font-bold uppercase tracking-wider text-[#57534E]">
                Case Type
              </Label>
              <Select value={form.case_type} onValueChange={(v) => {
                updateField("case_type", v);
                if (v === "Sterilisation Only Case") {
                  updateField("condition", "");
                }
              }}>
                <SelectTrigger className="h-12 mt-1" data-testid="case-type-select">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Rescue Case">Rescue Case</SelectItem>
                  <SelectItem value="Sterilisation Only Case">Sterilisation Only</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {/* Condition - disabled if Sterilisation Only */}
            <div>
              <Label className={`text-xs font-bold uppercase tracking-wider ${isSterilisationOnly ? 'text-[#A8A29E]' : 'text-[#57534E]'}`}>
                Condition {isSterilisationOnly && "(N/A)"}
              </Label>
              <Select 
                value={form.condition || ""} 
                onValueChange={(v) => updateField("condition", v)}
                disabled={isSterilisationOnly}
              >
                <SelectTrigger className={`h-12 mt-1 ${isSterilisationOnly ? 'opacity-50 cursor-not-allowed' : ''}`} data-testid="condition-select">
                  <SelectValue placeholder={isSterilisationOnly ? "Not applicable" : "Select condition"} />
                </SelectTrigger>
                <SelectContent>
                  {conditions.map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label className="text-xs font-bold uppercase tracking-wider text-[#57534E]">
                Status
              </Label>
              <Select value={form.status} onValueChange={(v) => updateField("status", v)}>
                <SelectTrigger className="h-12 mt-1" data-testid="status-select">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  {statuses.map((s) => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs font-bold uppercase tracking-wider text-[#57534E]">
                Current Shelter
              </Label>
              <Select value={form.current_shelter || ""} onValueChange={(v) => updateField("current_shelter", v)}>
                <SelectTrigger className="h-12 mt-1" data-testid="shelter-select">
                  <SelectValue placeholder="Select shelter" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="SEVA Shelter">SEVA Shelter</SelectItem>
                  <SelectItem value="Government Shelter">Government Shelter</SelectItem>
                  <SelectItem value="Private Shelter">Private Shelter</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs font-bold uppercase tracking-wider text-[#57534E]">
                Sterilisation Status
              </Label>
              <Select value={form.sterilisation_status} onValueChange={(v) => updateField("sterilisation_status", v)}>
                <SelectTrigger className="h-12 mt-1" data-testid="sterilisation-status-select">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Not Required">Not Required</SelectItem>
                  <SelectItem value="Pending">Pending</SelectItem>
                  <SelectItem value="Completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs font-bold uppercase tracking-wider text-[#57534E]">
                Arrival Date at SEVA
              </Label>
              <Input
                type="date"
                value={form.arrival_date_seva || ""}
                onChange={(e) => updateField("arrival_date_seva", e.target.value)}
                className="h-12 mt-1 bg-[#F5F5F4] border-2 border-[#E7E5E4] focus:border-[#4CAF50]"
                data-testid="arrival-date-input"
              />
            </div>
            <div className="sm:col-span-2">
              <Label className="text-xs font-bold uppercase tracking-wider text-[#57534E]">
                Condition Notes
              </Label>
              <Textarea
                value={form.condition_notes}
                onChange={(e) => updateField("condition_notes", e.target.value)}
                placeholder="Describe the animal's condition..."
                className="mt-1 bg-[#F5F5F4] border-2 border-[#E7E5E4] focus:border-[#4CAF50]"
                rows={3}
                data-testid="condition-notes-input"
              />
            </div>
          </div>
        </div>

        {/* Media Upload (Optional) */}
        <div className="bg-white border border-[#E7E5E4] rounded-lg p-5">
          <h2 className="text-lg font-semibold text-[#1C1917] mb-4 flex items-center gap-2" style={{ fontFamily: 'Manrope' }}>
            <Camera size={22} className="text-[#4CAF50]" />
            Photos & Videos (Optional)
          </h2>
          
          <div className="space-y-4">
            {/* Image Upload */}
            <div>
              <Label className="text-xs font-bold uppercase tracking-wider text-[#57534E]">
                Photos
              </Label>
              <div className="mt-2 flex flex-wrap gap-3">
                {pendingImages.map((file, idx) => (
                  <div key={idx} className="relative w-20 h-20 rounded-lg overflow-hidden bg-[#F5F5F4] border border-[#E7E5E4]">
                    <img 
                      src={URL.createObjectURL(file)} 
                      alt={`Preview ${idx}`}
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(idx)}
                      className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center"
                    >
                      <X size={12} />
                    </button>
                  </div>
                ))}
                <label className="w-20 h-20 rounded-lg border-2 border-dashed border-[#E7E5E4] flex flex-col items-center justify-center cursor-pointer hover:border-[#4CAF50] transition-colors">
                  <Camera size={24} className="text-[#78716C]" />
                  <span className="text-xs text-[#78716C] mt-1">Add</span>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleImageSelect}
                    className="hidden"
                    data-testid="image-upload-input"
                  />
                </label>
              </div>
            </div>

            {/* Video Upload */}
            <div>
              <Label className="text-xs font-bold uppercase tracking-wider text-[#57534E]">
                Videos
              </Label>
              <div className="mt-2 flex flex-wrap gap-3">
                {pendingVideos.map((file, idx) => (
                  <div key={idx} className="relative w-20 h-20 rounded-lg overflow-hidden bg-[#F5F5F4] border border-[#E7E5E4] flex items-center justify-center">
                    <VideoCamera size={32} className="text-[#78716C]" />
                    <button
                      type="button"
                      onClick={() => removeVideo(idx)}
                      className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center"
                    >
                      <X size={12} />
                    </button>
                  </div>
                ))}
                <label className="w-20 h-20 rounded-lg border-2 border-dashed border-[#E7E5E4] flex flex-col items-center justify-center cursor-pointer hover:border-[#4CAF50] transition-colors">
                  <VideoCamera size={24} className="text-[#78716C]" />
                  <span className="text-xs text-[#78716C] mt-1">Add</span>
                  <input
                    type="file"
                    accept="video/*"
                    multiple
                    onChange={handleVideoSelect}
                    className="hidden"
                    data-testid="video-upload-input"
                  />
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate(-1)}
            className="h-14 flex-1 border-2 font-semibold"
            data-testid="cancel-button"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={loading || uploadingMedia}
            className="h-14 flex-1 bg-[#4CAF50] hover:bg-[#43A047] text-white font-semibold"
            data-testid="submit-button"
          >
            {loading || uploadingMedia ? (
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                {uploadingMedia ? "Uploading Media..." : isEditing ? "Updating..." : "Creating..."}
              </div>
            ) : (
              isEditing ? "Update Case" : "Create Case"
            )}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default CaseForm;

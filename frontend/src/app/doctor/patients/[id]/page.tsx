/**
 * Patient Medical Documents Management Page for Doctors
 * Allows doctors to view and upload medical documents for a specific patient
 */

'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import {
  FileText,
  Upload,
  Download,
  Trash2,
  Eye,
  X,
  CheckCircle,
  AlertCircle,
  Activity,
  Pill,
  Syringe,
  Shield,
  User,
  ArrowLeft,
  Heart,
  Calendar,
  Phone,
  Mail,
  Plus,
  Loader2,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input, Select } from '@/components/ui/Input';
import api from '@/lib/api';
import logger from '@/lib/logger';
import { Document, MedicalRecord, DoctorPatientSummary } from '@/types';

export default function PatientDocumentsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const patientId = Number(params.id);

  const [patient, setPatient] = useState<DoctorPatientSummary | null>(null);
  const [medicalRecord, setMedicalRecord] = useState<MedicalRecord | null>(null);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadData, setUploadData] = useState({
    document_type: 'lab_result',
    title: '',
    description: '',
  });
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const loadPatientData = useCallback(async () => {
    try {
      setLoading(true);
      const [patientsRes, recordsRes, documentsRes] = await Promise.all([
        api.doctor.patients(),
        api.medicalRecords.getByPatient(patientId),
        api.documents.list({ patient_id: patientId }),
      ]);

      // Find the patient in the list
      const patientsList = Array.isArray(patientsRes.data)
        ? patientsRes.data
        : (patientsRes.data as any)?.items || [];
      const foundPatient = patientsList.find((p: DoctorPatientSummary) => p.id === patientId);
      setPatient(foundPatient || null);

      // Get medical record
      const records = Array.isArray(recordsRes.data) ? recordsRes.data : [];
      if (records.length > 0) {
        setMedicalRecord(records[0]);
      }

      // Get documents
      const documentsList = Array.isArray(documentsRes.data) ? documentsRes.data : [];
      setDocuments(documentsList);
    } catch (error: any) {
      logger.error('Failed to load patient data', {
        userId: user?.id,
        patientId,
        errorMessage: error?.message,
      }, error);
      setMessage({ type: 'error', text: 'Failed to load patient data' });
    } finally {
      setLoading(false);
    }
  }, [patientId, user]);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
      return;
    }

    if (user && user.role !== 'doctor') {
      router.push('/login');
      return;
    }

    if (user && patientId) {
      void loadPatientData();
    }
  }, [user, authLoading, router, patientId, loadPatientData]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Check file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        setMessage({ type: 'error', text: 'File size must be less than 10MB' });
        return;
      }
      setUploadFile(file);
      if (!uploadData.title) {
        setUploadData({ ...uploadData, title: file.name });
      }
    }
  };

  const handleUploadDocument = async () => {
    if (!uploadFile || !uploadData.title) {
      setMessage({ type: 'error', text: 'Please select a file and provide a title' });
      return;
    }

    try {
      setUploading(true);
      await api.documents.upload(uploadFile, {
        ...uploadData,
        patient_id: patientId,
        uploaded_by_doctor: true,
      });

      setMessage({ type: 'success', text: 'Document uploaded successfully!' });
      setShowUploadModal(false);
      setUploadFile(null);
      setUploadData({
        document_type: 'lab_result',
        title: '',
        description: '',
      });

      await loadPatientData();
    } catch (error: any) {
      logger.error('Failed to upload document', {
        userId: user?.id,
        patientId,
        documentType: uploadData.document_type,
        errorMessage: error?.message,
      }, error);
      setMessage({
        type: 'error',
        text: error.response?.data?.detail || 'Failed to upload document',
      });
    } finally {
      setUploading(false);
    }
  };

  const handleDownloadDocument = async (doc: Document) => {
    try {
      const response = await api.documents.download(doc.id);
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', doc.file_name);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error: any) {
      logger.error('Failed to download document', {
        userId: user?.id,
        documentId: doc.id,
        errorMessage: error?.message,
      }, error);
      setMessage({ type: 'error', text: 'Failed to download document' });
    }
  };

  const handleDeleteDocument = async (docId: number) => {
    if (!confirm('Are you sure you want to delete this document?')) {
      return;
    }

    try {
  await api.documents.delete(docId);
  setMessage({ type: 'success', text: 'Document deleted successfully' });
  await loadPatientData();
    } catch (error: any) {
      logger.error('Failed to delete document', {
        userId: user?.id,
        documentId: docId,
        errorMessage: error?.message,
      }, error);
      setMessage({ type: 'error', text: 'Failed to delete document' });
    }
  };

  const getDocumentTypeIcon = (type: string) => {
    switch (type) {
      case 'lab_result':
        return <Activity className="w-5 h-5" />;
      case 'prescription':
        return <Pill className="w-5 h-5" />;
      case 'imaging':
        return <Eye className="w-5 h-5" />;
      case 'vaccination':
        return <Syringe className="w-5 h-5" />;
      case 'insurance':
        return <Shield className="w-5 h-5" />;
      default:
        return <FileText className="w-5 h-5" />;
    }
  };

  const formatFileSize = (bytes?: number | null) => {
    if (!bytes || Number.isNaN(bytes)) {
      return '0 B';
    }
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading patient data...</p>
        </div>
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="max-w-md">
          <CardContent className="text-center py-12">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-900 mb-2">Patient Not Found</h2>
            <p className="text-gray-600 mb-6">The requested patient could not be found.</p>
            <Button onClick={() => router.push('/doctor/patients')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Patients
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push('/doctor/patients')}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {patient.first_name} {patient.last_name}
                </h1>
                <p className="text-gray-600 mt-1">Medical Records &amp; Documents</p>
              </div>
            </div>
            <div className="flex gap-3 w-full sm:w-auto">
              <Button 
                variant="outline" 
                onClick={() => router.push(`/doctor/prescriptions?patient_id=${patientId}`)}
                className="flex-1 sm:flex-initial bg-gradient-to-r from-purple-50 to-blue-50 hover:from-purple-100 hover:to-blue-100 border-2 border-purple-300 text-purple-700 font-semibold"
              >
                <Pill className="w-5 h-5 mr-2" />
                New Prescription
              </Button>
              <Button 
                onClick={() => setShowUploadModal(true)}
                className="flex-1 sm:flex-initial"
              >
                <Upload className="w-5 h-5 mr-2" />
                Upload Document
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Message Alert */}
        {message && (
          <div
            className={`mb-6 rounded-lg px-4 py-3 flex items-center gap-2 shadow-sm ${
              message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
            }`}
          >
            {message.type === 'success' ? (
              <CheckCircle className="h-5 w-5" />
            ) : (
              <AlertCircle className="h-5 w-5" />
            )}
            <span className="text-sm font-medium">{message.text}</span>
            <button
              onClick={() => setMessage(null)}
              className="ml-auto text-current opacity-70 hover:opacity-100"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Upload Modal */}
        {showUploadModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <Card className="max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>Upload Medical Document</CardTitle>
                  <button
                    onClick={() => setShowUploadModal(false)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Document Type *
                    </label>
                    <Select
                      value={uploadData.document_type}
                      onChange={(e) => setUploadData({ ...uploadData, document_type: e.target.value })}
                    >
                      <option value="lab_result">Lab Result / Analysis</option>
                      <option value="imaging">Imaging (X-Ray, MRI, CT, Ultrasound)</option>
                      <option value="prescription">Prescription</option>
                      <option value="vaccination">Vaccination Record</option>
                      <option value="consultation_note">Consultation Note</option>
                      <option value="surgery_report">Surgery Report</option>
                      <option value="discharge_summary">Discharge Summary</option>
                      <option value="insurance">Insurance Document</option>
                      <option value="other">Other</option>
                    </Select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Title *
                    </label>
                    <Input
                      value={uploadData.title}
                      onChange={(e) => setUploadData({ ...uploadData, title: e.target.value })}
                      placeholder="e.g., Blood Test Results - October 2025"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Description
                    </label>
                    <textarea
                      value={uploadData.description}
                      onChange={(e) => setUploadData({ ...uploadData, description: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                      rows={3}
                      placeholder="Additional notes about this document"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Select File * (Max 10MB)
                    </label>
                    <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-lg hover:border-primary transition-colors">
                      <div className="space-y-1 text-center">
                        <Upload className="mx-auto h-12 w-12 text-gray-400" />
                        <div className="flex text-sm text-gray-600">
                          <label className="relative cursor-pointer bg-white rounded-md font-medium text-primary hover:text-primary-dark">
                            <span>Upload a file</span>
                            <input
                              type="file"
                              className="sr-only"
                              onChange={handleFileSelect}
                              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.dcm"
                            />
                          </label>
                          <p className="pl-1">or drag and drop</p>
                        </div>
                        <p className="text-xs text-gray-500">
                          PDF, DOC, DOCX, JPG, JPEG, PNG, DICOM up to 10MB
                        </p>
                        {uploadFile && (
                          <p className="text-sm text-green-600 mt-2">
                            <CheckCircle className="w-4 h-4 inline mr-1" />
                            {uploadFile.name} ({formatFileSize(uploadFile.size)})
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-6 flex justify-end space-x-3">
                  <Button variant="outline" onClick={() => setShowUploadModal(false)} disabled={uploading}>
                    Cancel
                  </Button>
                  <Button
                    onClick={handleUploadDocument}
                    disabled={!uploadFile || !uploadData.title || uploading}
                    loading={uploading}
                  >
                    Upload Document
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Patient Information Summary */}
          <div className="lg:col-span-1 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <User className="w-5 h-5 mr-2 text-blue-500" />
                  Patient Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-600">Full Name</label>
                    <p className="text-gray-900">
                      {patient.first_name} {patient.last_name}
                    </p>
                  </div>
                  {patient.email && (
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-gray-400" />
                      <p className="text-sm text-gray-900">{patient.email}</p>
                    </div>
                  )}
                  {patient.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-gray-400" />
                      <p className="text-sm text-gray-900">{patient.phone}</p>
                    </div>
                  )}
                  {patient.last_appointment_date && (
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <div>
                        <p className="text-xs text-gray-600">Last Visit</p>
                        <p className="text-sm text-gray-900">
                          {new Date(patient.last_appointment_date).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Medical Information */}
            {medicalRecord && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Heart className="w-5 h-5 mr-2 text-red-500" />
                    Medical Information
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {medicalRecord.blood_type && (
                      <div>
                        <label className="text-sm font-medium text-gray-600">Blood Type</label>
                        <p className="text-gray-900">{medicalRecord.blood_type}</p>
                      </div>
                    )}
                    {medicalRecord.allergies && (
                      <div>
                        <label className="text-sm font-medium text-gray-600">Allergies</label>
                        <p className="text-gray-900">{medicalRecord.allergies}</p>
                      </div>
                    )}
                    {medicalRecord.chronic_conditions && (
                      <div>
                        <label className="text-sm font-medium text-gray-600">Chronic Conditions</label>
                        <p className="text-gray-900">{medicalRecord.chronic_conditions}</p>
                      </div>
                    )}
                    {medicalRecord.medications && (
                      <div>
                        <label className="text-sm font-medium text-gray-600">Current Medications</label>
                        <p className="text-gray-900">
                          {Array.isArray(medicalRecord.medications) 
                            ? medicalRecord.medications.map((m: { name: string; dosage: string; frequency: string }) => `${m.name} (${m.dosage})`).join(', ')
                            : medicalRecord.medications}
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Documents List */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <FileText className="w-5 h-5 mr-2" />
                  Medical Documents ({documents.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {documents.length === 0 ? (
                  <div className="text-center py-12">
                    <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">No documents uploaded yet</p>
                    <Button onClick={() => setShowUploadModal(true)} className="mt-4">
                      Upload First Document
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {documents.map(doc => (
                      <div key={doc.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start space-x-3 flex-1">
                            <div className="p-2 bg-primary/10 rounded-lg text-primary">
                              {getDocumentTypeIcon(doc.document_type)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="font-medium text-gray-900 truncate">{doc.title}</h4>
                              <p className="text-sm text-gray-600 mt-1">
                                {doc.document_type.replace('_', ' ')} • {formatFileSize(doc.file_size_bytes)}
                              </p>
                              {doc.description && (
                                <p className="text-sm text-gray-500 mt-2">{doc.description}</p>
                              )}
                              <p className="text-xs text-gray-400 mt-2">
                                Uploaded on {new Date(doc.created_at).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2 ml-4">
                            <button
                              onClick={() => handleDownloadDocument(doc)}
                              className="p-2 text-primary hover:bg-primary/10 rounded-lg transition-colors"
                              title="Download"
                            >
                              <Download className="w-5 h-5" />
                            </button>
                            <button
                              onClick={() => handleDeleteDocument(doc.id)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Delete"
                            >
                              <Trash2 className="w-5 h-5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

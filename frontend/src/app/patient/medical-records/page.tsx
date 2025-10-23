/**
 * Medical Records Viewer with Document Upload
 * Allows patients to view their medical history and upload documents
 */

'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { 
  FileText, 
  Upload, 
  Download, 
  Trash2, 
  Eye,
  X,
  AlertCircle,
  CheckCircle,
  Heart,
  Activity,
  Pill,
  Syringe,
  Shield,
  User,
  Search,
  Filter,
  ArrowLeft,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input, Select } from '@/components/ui/Input';
import api from '@/lib/api';
import logger from '@/lib/logger';
import { MedicalRecord, Document } from '@/types';

export default function MedicalRecordsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [medicalRecord, setMedicalRecord] = useState<MedicalRecord | null>(null);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadData, setUploadData] = useState({
    document_type: 'lab_result',
    title: '',
    description: ''
  });
  const [uploading, setUploading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
      return;
    }

    if (user && user.role !== 'patient') {
      router.push('/login');
      return;
    }

    if (user) {
      loadMedicalData();
    }
  }, [user, authLoading, router]);

  const loadMedicalData = async () => {
    try {
      setLoading(true);
      const [recordsRes, documentsRes] = await Promise.all([
        api.medicalRecords.list({ limit: 1 }),
        api.documents.list({ patient_id: user?.id })
      ]);

      const records = Array.isArray(recordsRes.data) ? recordsRes.data : [];
      if (records.length > 0) {
        setMedicalRecord(records[0]);
      }

      const documentsList = Array.isArray(documentsRes.data) ? documentsRes.data : [];
      setDocuments(documentsList);
    } catch (error: any) {
      logger.error('Failed to load medical data', {
        userId: user?.id,
        errorMessage: error?.message,
      }, error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Check file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        alert('File size must be less than 10MB');
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
      alert('Please select a file and provide a title');
      return;
    }

    try {
      setUploading(true);
      await api.documents.upload(uploadFile, {
        ...uploadData,
        patient_id: user?.id
      });
      
      alert('Document uploaded successfully!');
      setShowUploadModal(false);
      setUploadFile(null);
      setUploadData({
        document_type: 'lab_result',
        title: '',
        description: ''
      });
      
      loadMedicalData();
    } catch (error: any) {
      logger.error('Failed to upload document', {
        userId: user?.id,
        documentType: uploadData.document_type,
        errorMessage: error?.message,
      }, error);
      alert(error.response?.data?.detail || 'Failed to upload document');
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
      alert('Failed to download document');
    }
  };

  const handleDeleteDocument = async (docId: number) => {
    if (!confirm('Are you sure you want to delete this document?')) {
      return;
    }

    try {
      await api.documents.delete(docId);
      alert('Document deleted successfully');
      loadMedicalData();
    } catch (error: any) {
      logger.error('Failed to delete document', {
        userId: user?.id,
        documentId: docId,
        errorMessage: error?.message,
      }, error);
      alert('Failed to delete document');
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

  const filteredDocuments = useMemo(() => {
    return documents.filter(doc => {
      const matchesSearch = !searchTerm ||
        doc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doc.description?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesType = filterType === 'all' || doc.document_type === filterType;
      return matchesSearch && matchesType;
    });
  }, [documents, searchTerm, filterType]);

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Dossiers médicaux</h1>
              <p className="text-gray-600 mt-1">Consultez vos antécédents médicaux et vos documents</p>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
              <Button
                variant="outline"
                onClick={() => router.push('/patient/dashboard')}
              >
                <ArrowLeft className="w-5 h-5 mr-2" />
                Retour au tableau de bord
              </Button>
              <Button onClick={() => setShowUploadModal(true)}>
                <Upload className="w-5 h-5 mr-2" />
                Télécharger le document
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Upload Modal */}
        {showUploadModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <Card className="max-w-2xl w-full">
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>Upload Medical Document</CardTitle>
                  <button onClick={() => setShowUploadModal(false)} className="text-gray-500 hover:text-gray-700">
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
                      <option value="lab_result">Résultat de laboratoire</option>
                      <option value="prescription">Ordonnance</option>
                      <option value="imaging">Imagerie (Radiographie, IRM, CT)</option>
                      <option value="vaccination">Carnet de vaccination</option>
                      <option value="insurance">Document d'assurance</option>
                      <option value="other">Autre</option>
                    </Select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Titre *
                    </label>
                    <Input
                      value={uploadData.title}
                      onChange={(e) => setUploadData({ ...uploadData, title: e.target.value })}
                      placeholder="e.g., Résultats de tests sanguins - Jan 2024"
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
                      placeholder="Notes complémentaires sur ce document"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Sélectionner un fichier * (Max 10MB)
                    </label>
                    <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-lg hover:border-primary transition-colors">
                      <div className="space-y-1 text-center">
                        <Upload className="mx-auto h-12 w-12 text-gray-400" />
                        <div className="flex text-sm text-gray-600">
                          <label className="relative cursor-pointer bg-white rounded-md font-medium text-primary hover:text-primary-dark">
                            <span>Télécharger un fichier</span>
                            <input
                              type="file"
                              className="sr-only"
                              onChange={handleFileSelect}
                              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                            />
                          </label>
                          <p className="pl-1">ou glisser-déposer</p>
                        </div>
                        <p className="text-xs text-gray-500">
                          PDF, DOC, DOCX, JPG, JPEG, PNG jusqu'à 10 Mo
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
                    Annuler
                  </Button>
                  <Button 
                    onClick={handleUploadDocument}
                    disabled={!uploadFile || !uploadData.title || uploading}
                    loading={uploading}
                  >
                    Télécharger le document
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Medical Information Summary */}
          <div className="lg:col-span-1 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Heart className="w-5 h-5 mr-2 text-red-500" />
                  Informations médicales
                </CardTitle>
              </CardHeader>
              <CardContent>
                {medicalRecord ? (
                  <div className="space-y-4">
                    {medicalRecord.blood_type && (
                      <div>
                        <label className="text-sm font-medium text-gray-600">Groupe Sanguin</label>
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
                        <label className="text-sm font-medium text-gray-600">Conditions Chroniques</label>
                        <p className="text-gray-900">{medicalRecord.chronic_conditions}</p>
                      </div>
                    )}
                    {medicalRecord.current_medications && (
                      <div>
                        <label className="text-sm font-medium text-gray-600">Médicaments Actuels</label>
                        <p className="text-gray-900">{medicalRecord.current_medications}</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-600 text-sm">Aucune information médicale disponible</p>
                    <p className="text-gray-500 text-xs mt-1">Votre médecin ajoutera cela lors des visites</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {medicalRecord?.insurance_provider && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Shield className="w-5 h-5 mr-2 text-blue-500" />
                    Informations d'Assurance
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm font-medium text-gray-600">Fournisseur</label>
                      <p className="text-gray-900">{medicalRecord.insurance_provider}</p>
                    </div>
                    {medicalRecord.insurance_policy_number && (
                      <div>
                        <label className="text-sm font-medium text-gray-600">Numéro de Police</label>
                        <p className="text-gray-900">{medicalRecord.insurance_policy_number}</p>
                      </div>
                    )}
                    {medicalRecord.insurance_expiry_date && (
                      <div>
                        <label className="text-sm font-medium text-gray-600">Date d'Expiration</label>
                        <p className="text-gray-900">
                          {new Date(medicalRecord.insurance_expiry_date).toLocaleDateString()}
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {medicalRecord?.emergency_contact_name && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <User className="w-5 h-5 mr-2 text-orange-500" />
                    Contact d'Urgence
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm font-medium text-gray-600">Nom</label>
                      <p className="text-gray-900">{medicalRecord.emergency_contact_name}</p>
                    </div>
                    {medicalRecord.emergency_contact_phone && (
                      <div>
                        <label className="text-sm font-medium text-gray-600">Téléphone</label>
                        <p className="text-gray-900">{medicalRecord.emergency_contact_phone}</p>
                      </div>
                    )}
                    {medicalRecord.emergency_contact_relationship && (
                      <div>
                        <label className="text-sm font-medium text-gray-600">Relation</label>
                        <p className="text-gray-900">{medicalRecord.emergency_contact_relationship}</p>
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
                  Documents Médicaux ({documents.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {/* Search and Filter */}
                {documents.length > 0 && (
                  <div className="mb-6 flex flex-col sm:flex-row gap-3">
                    <div className="flex-1 relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <Input
                        type="text"
                        placeholder="Rechercher des documents par titre ou par description..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                    <div className="flex items-center space-x-2">
                      <Filter className="w-4 h-4 text-gray-500" />
                      <Select
                        value={filterType}
                        onChange={(e) => setFilterType(e.target.value)}
                        className="w-48"
                      >
                        <option value="all">Tous les Types</option>
                        <option value="lab_result">Résultats de Laboratoire</option>
                        <option value="prescription">Prescriptions</option>
                        <option value="imaging">Imagerie</option>
                        <option value="vaccination">Vaccinations</option>
                        <option value="insurance">Assurance</option>
                        <option value="other">Autre</option>
                      </Select>
                    </div>
                  </div>
                )}

                {documents.length === 0 ? (
                  <div className="text-center py-12">
                    <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">Aucun document téléchargé pour le moment</p>
                    <Button onClick={() => setShowUploadModal(true)} className="mt-4">
                      Télécharger votre premier document
                    </Button>
                  </div>
                ) : filteredDocuments.length === 0 ? (
                  <div className="text-center py-12">
                    <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">Aucun document ne correspond à votre recherche ou à votre filtre</p>
                    <Button 
                      variant="outline" 
                      onClick={() => { setSearchTerm(''); setFilterType('all'); }} 
                      className="mt-4"
                    >
                      Effacer les filtres
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filteredDocuments.map(doc => (
                      <div key={doc.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start space-x-3 flex-1">
                            <div className="p-2 bg-primary/10 rounded-lg text-primary">
                              {getDocumentTypeIcon(doc.document_type)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="font-medium text-gray-900 truncate">{doc.title}</h4>
                              <p className="text-sm text-gray-600 mt-1">
                                {doc.document_type.replace('_', ' ')} • {formatFileSize(doc.file_size ?? doc.file_size_bytes)}
                              </p>
                              {doc.description && (
                                <p className="text-sm text-gray-500 mt-2">{doc.description}</p>
                              )}
                              <p className="text-xs text-gray-400 mt-2">
                                Téléchargé le {new Date(doc.created_at).toLocaleDateString()}
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

"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Building2, Users, Megaphone, Package, Target, Edit, CheckCircle, MapPin, Mail, Phone, Globe, ChevronRight, ChevronLeft, Loader2, Check } from "lucide-react";
import { toast } from "sonner";

export default function ProfilePage() {
  const params = useParams();
  const router = useRouter();
  const orgSlug = params.organizationSlug as string;
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<any>({});

  useEffect(() => {
    loadProfile();
  }, [orgSlug]);

  const loadProfile = async () => {
    try {
      const res = await fetch(`/api/marketing/profile?organizationSlug=${orgSlug}`);
      if (res.ok) {
        const data = await res.json();
        console.log('Loaded profile:', data); // DEBUG
        if (data.profile) {
          setProfile(data.profile);
          setFormData(data.profile);
        }
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async (completed = false) => {
    setIsSaving(true);
    try {
      const response = await fetch('/api/marketing/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organizationSlug: orgSlug,
          ...formData,
          isComplete: completed,
        }),
      });

      if (!response.ok) throw new Error('Error al guardar');
      
      const result = await response.json();
      
      if (completed) {
        toast.success('¡Perfil completado! Tu marketing automático está listo.');
        setProfile({ ...formData, isComplete: true });
        setIsEditing(false);
        router.push(`/app/${orgSlug}/marketing/dashboard`);
      } else {
        toast.success('Perfil guardado');
      }
    } catch (error) {
      toast.error('No se pudo guardar el perfil');
    } finally {
      setIsSaving(false);
    }
  };

  const updateField = (field: string, value: any) => {
    setFormData((prev: any) => ({ ...prev, [field]: value }));
  };

  // LOADING
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  // VISTA DE RESUMEN (si perfil completo y no editando)
  if (profile?.isComplete === true && !isEditing) {
    return (
      <div className="max-w-4xl mx-auto py-6 px-4">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
              Perfil de Empresa
            </h1>
            <p className="text-gray-500 mt-1">Tu configuración está completa</p>
          </div>
          <button 
            onClick={() => setIsEditing(true)}
            className="flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-gray-50"
          >
            <Edit className="w-4 h-4" />
            Editar perfil
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Card: Información Básica */}
          <div className="bg-white border rounded-xl p-5">
            <h3 className="font-semibold flex items-center gap-2 mb-4">
              <Building2 className="w-5 h-5 text-blue-500" />
              Información Básica
            </h3>
            <div className="space-y-3 text-sm">
              <div><span className="text-gray-500">Nombre:</span> <span className="font-medium">{profile.businessName}</span></div>
              <div><span className="text-gray-500">Industria:</span> <span className="font-medium">{profile.industry}</span></div>
              <div><span className="text-gray-500">Ubicación:</span> <span className="font-medium">{profile.location}</span></div>
              <div><span className="text-gray-500">Web:</span> <span className="font-medium">{profile.websiteUrl || profile.website}</span></div>
            </div>
          </div>

          {/* Card: Tu Público */}
          <div className="bg-white border rounded-xl p-5">
            <h3 className="font-semibold flex items-center gap-2 mb-4">
              <Users className="w-5 h-5 text-purple-500" />
              Tu Público
            </h3>
            <div className="space-y-3 text-sm">
              <div><span className="text-gray-500">Cliente ideal:</span> <span className="font-medium">{profile.targetAudience || 'No definido'}</span></div>
              <div><span className="text-gray-500">Edad:</span> <span className="font-medium">{profile.ageRangeMin || profile.ageMin} - {profile.ageRangeMax || profile.ageMax} años</span></div>
              <div><span className="text-gray-500">Ubicaciones:</span> <span className="font-medium">{Array.isArray(profile.targetLocations) ? profile.targetLocations.join(", ") : profile.targetLocations}</span></div>
            </div>
          </div>

          {/* Card: Voz de Marca */}
          <div className="bg-white border rounded-xl p-5">
            <h3 className="font-semibold flex items-center gap-2 mb-4">
              <Megaphone className="w-5 h-5 text-pink-500" />
              Voz de Marca
            </h3>
            <div className="space-y-3 text-sm">
              <div><span className="text-gray-500">Personalidad:</span> <span className="font-medium">{Array.isArray(profile.brandPersonality) ? profile.brandPersonality.join(", ") : profile.brandPersonality || 'No definida'}</span></div>
              <div><span className="text-gray-500">Tono:</span> <span className="font-medium">{profile.toneOfVoice || 'No definido'}</span></div>
              <div><span className="text-gray-500">Emojis:</span> <span className="font-medium">{profile.useEmojis ? 'Sí' : 'No'}</span></div>
            </div>
          </div>

          {/* Card: Objetivos */}
          <div className="bg-white border rounded-xl p-5">
            <h3 className="font-semibold flex items-center gap-2 mb-4">
              <Target className="w-5 h-5 text-red-500" />
              Objetivos
            </h3>
            <div className="space-y-3 text-sm">
              <div><span className="text-gray-500">Frecuencia:</span> <span className="font-medium">{profile.contentPreferences?.postingFrequency || profile.postingFrequency || profile.postFrequency || 'No definida'}</span></div>
              {profile.marketingGoals?.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {profile.marketingGoals.map((goal: string, i: number) => (
                    <span key={i} className="bg-green-50 text-green-700 text-xs px-2 py-1 rounded-full">{goal}</span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="mt-8 p-6 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold">¡Todo listo!</h3>
              <p className="text-gray-600 text-sm">Tu marketing automático está configurado.</p>
            </div>
            <button 
              onClick={() => router.push(`/app/${orgSlug}/marketing/dashboard`)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
            >
              Ir al Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  // WIZARD (si no está completo o está editando)
  const steps = [
    { id: 1, name: 'Información Básica', icon: Building2 },
    { id: 2, name: 'Tu Público', icon: Users },
    { id: 3, name: 'Voz de Marca', icon: Megaphone },
    { id: 4, name: 'Productos', icon: Package },
    { id: 5, name: 'Objetivos', icon: Target },
  ];

  return (
    <div className="max-w-3xl mx-auto py-6 px-4">
      {/* Header */}
      {isEditing && (
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-xl font-bold">Editar perfil</h1>
          <button onClick={() => { setIsEditing(false); setFormData(profile); }} className="text-gray-500 hover:text-gray-700">
            Cancelar
          </button>
        </div>
      )}

      {/* Progress */}
      <div className="flex items-center justify-between mb-8">
        {steps.map((step, i) => (
          <div key={step.id} className="flex items-center">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
              currentStep > step.id ? 'bg-green-500 text-white' :
              currentStep === step.id ? 'bg-blue-600 text-white' :
              'bg-gray-200 text-gray-500'
            }`}>
              {currentStep > step.id ? <Check className="w-5 h-5" /> : <step.icon className="w-5 h-5" />}
            </div>
            {i < steps.length - 1 && (
              <div className={`w-12 h-1 mx-2 ${currentStep > step.id ? 'bg-green-500' : 'bg-gray-200'}`} />
            )}
          </div>
        ))}
      </div>

      {/* Form Card */}
      <div className="bg-white border rounded-xl p-6">
        <h2 className="text-xl font-semibold mb-1">{steps[currentStep - 1].name}</h2>
        <p className="text-gray-500 text-sm mb-6">Paso {currentStep} de 5</p>

        {/* Step 1 */}
        {currentStep === 1 && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Nombre del negocio *</label>
              <input
                type="text"
                value={formData.businessName || ''}
                onChange={(e) => updateField('businessName', e.target.value)}
                className="w-full border rounded-lg px-3 py-2"
                placeholder="Tu empresa"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Industria *</label>
              <select
                value={formData.industry || ''}
                onChange={(e) => updateField('industry', e.target.value)}
                className="w-full border rounded-lg px-3 py-2"
              >
                <option value="">Selecciona...</option>
                <option value="Tecnología">Tecnología</option>
                <option value="Restaurante">Restaurante</option>
                <option value="Retail">Retail</option>
                <option value="Servicios">Servicios</option>
                <option value="Salud">Salud</option>
                <option value="Educación">Educación</option>
                <option value="Otro">Otro</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Descripción *</label>
              <textarea
                value={formData.description || ''}
                onChange={(e) => updateField('description', e.target.value)}
                className="w-full border rounded-lg px-3 py-2 h-24"
                placeholder="Describe tu negocio..."
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Ubicación</label>
                <input
                  type="text"
                  value={formData.location || ''}
                  onChange={(e) => updateField('location', e.target.value)}
                  className="w-full border rounded-lg px-3 py-2"
                  placeholder="Barcelona, España"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Sitio web</label>
                <input
                  type="url"
                  value={formData.websiteUrl || formData.website || ''}
                  onChange={(e) => updateField('websiteUrl', e.target.value)}
                  className="w-full border rounded-lg px-3 py-2"
                  placeholder="https://..."
                />
              </div>
            </div>
          </div>
        )}

        {/* Step 2 */}
        {currentStep === 2 && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">¿Quién es tu cliente ideal? *</label>
              <textarea
                value={formData.targetAudience || ''}
                onChange={(e) => updateField('targetAudience', e.target.value)}
                className="w-full border rounded-lg px-3 py-2 h-24"
                placeholder="Describe a tu cliente ideal..."
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Edad mínima</label>
                <input
                  type="number"
                  value={formData.ageRangeMin || formData.ageMin || 18}
                  onChange={(e) => updateField('ageRangeMin', parseInt(e.target.value))}
                  className="w-full border rounded-lg px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Edad máxima</label>
                <input
                  type="number"
                  value={formData.ageRangeMax || formData.ageMax || 65}
                  onChange={(e) => updateField('ageRangeMax', parseInt(e.target.value))}
                  className="w-full border rounded-lg px-3 py-2"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Ubicaciones objetivo</label>
              <input
                type="text"
                value={Array.isArray(formData.targetLocations) ? formData.targetLocations.join(", ") : formData.targetLocations || ''}
                onChange={(e) => updateField('targetLocations', e.target.value)}
                className="w-full border rounded-lg px-3 py-2"
                placeholder="España, Latinoamérica..."
              />
            </div>
          </div>
        )}

        {/* Step 3 */}
        {currentStep === 3 && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Personalidad de marca</label>
              <select
                value={Array.isArray(formData.brandPersonality) ? formData.brandPersonality[0] : formData.brandPersonality || ''}
                onChange={(e) => updateField('brandPersonality', e.target.value ? [e.target.value] : [])}
                className="w-full border rounded-lg px-3 py-2"
              >
                <option value="">Selecciona...</option>
                <option value="Profesional">Profesional</option>
                <option value="Amigable">Amigable</option>
                <option value="Divertida">Divertida</option>
                <option value="Seria">Seria</option>
                <option value="Innovadora">Innovadora</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Tono de voz</label>
              <select
                value={formData.toneOfVoice || ''}
                onChange={(e) => updateField('toneOfVoice', e.target.value)}
                className="w-full border rounded-lg px-3 py-2"
              >
                <option value="">Selecciona...</option>
                <option value="Formal">Formal</option>
                <option value="Casual">Casual</option>
                <option value="Inspirador">Inspirador</option>
                <option value="Educativo">Educativo</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="useEmojis"
                checked={formData.useEmojis || false}
                onChange={(e) => updateField('useEmojis', e.target.checked)}
                className="rounded"
              />
              <label htmlFor="useEmojis" className="text-sm">Usar emojis en publicaciones</label>
            </div>
          </div>
        )}

        {/* Step 4 */}
        {currentStep === 4 && (
          <div className="space-y-4">
            <p className="text-gray-500 text-sm">Lista tus productos o servicios principales (opcional)</p>
            <div>
              <label className="block text-sm font-medium mb-1">Productos/Servicios</label>
              <textarea
                value={formData.productsText || ''}
                onChange={(e) => updateField('productsText', e.target.value)}
                className="w-full border rounded-lg px-3 py-2 h-32"
                placeholder="- Desarrollo web: €2000&#10;- Apps móviles: €5000&#10;- Consultoría: €100/hora"
              />
            </div>
          </div>
        )}

        {/* Step 5 */}
        {currentStep === 5 && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">¿Cuáles son tus objetivos?</label>
              <div className="space-y-2">
                {['Aumentar seguidores', 'Generar leads', 'Vender más', 'Mejorar engagement', 'Branding'].map((goal) => (
                  <label key={goal} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.marketingGoals?.includes(goal) || false}
                      onChange={(e) => {
                        const goals = formData.marketingGoals || [];
                        if (e.target.checked) {
                          updateField('marketingGoals', [...goals, goal]);
                        } else {
                          updateField('marketingGoals', goals.filter((g: string) => g !== goal));
                        }
                      }}
                      className="rounded"
                    />
                    <span className="text-sm">{goal}</span>
                  </label>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Frecuencia de publicaciones</label>
              <select
                value={formData.contentPreferences?.postingFrequency || formData.postingFrequency || ''}
                onChange={(e) => updateField('postingFrequency', e.target.value)}
                className="w-full border rounded-lg px-3 py-2"
              >
                <option value="">Selecciona...</option>
                <option value="daily">1 por día</option>
                <option value="3x-week">3-4 por semana</option>
                <option value="weekly">1 por semana</option>
              </select>
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="flex items-center justify-between mt-8 pt-6 border-t">
          {currentStep > 1 ? (
            <button
              onClick={() => setCurrentStep(currentStep - 1)}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
            >
              <ChevronLeft className="w-4 h-4" />
              Anterior
            </button>
          ) : (
            <div />
          )}

          <div className="flex gap-3">
            <button
              onClick={() => handleSave(false)}
              disabled={isSaving}
              className="px-4 py-2 border rounded-lg hover:bg-gray-50"
            >
              Guardar
            </button>

            {currentStep < 5 ? (
              <button
                onClick={() => setCurrentStep(currentStep + 1)}
                className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
              >
                Siguiente
                <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={() => handleSave(true)}
                disabled={isSaving}
                className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Guardando...
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    Completar
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

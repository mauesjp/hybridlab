import { bodyCompositionService } from "../services/bodyCompositionService";
import type { BodyCompositionResult } from "../types/bodyComposition";
import { useCallback, useEffect, useMemo, useState } from "react";

import { physicalAssessmentService } from "../services/physicalAssessmentService";

import PhysicalAssessmentAnalytics from "../components/PhysicalAssessmentAnalytics";

import type {
  PhysicalAssessment,
  PhysicalAssessmentInput,
  PhysicalAssessmentPhoto,
  PhysicalAssessmentPhotoType,
  PhysicalAssessmentSkinfoldInput,
  PhysicalAssessmentSummary,
  PhysicalAssessmentTapeInput,
} from "../types/physicalAssessment";

type NumericFormValue = string | number | null | undefined;

type TapeForm = Record<keyof PhysicalAssessmentTapeInput, string>;

type SkinfoldForm = Record<keyof PhysicalAssessmentSkinfoldInput, string>;

const photoTypes: {
  type: PhysicalAssessmentPhotoType;
  label: string;
}[] = [
  {
    type: 0,
    label: "Frente",
  },
  {
    type: 1,
    label: "Costas",
  },
  {
    type: 2,
    label: "Lateral esquerda",
  },
  {
    type: 3,
    label: "Lateral direita",
  },
];

const tapeFields: {
  key: keyof PhysicalAssessmentTapeInput;
  label: string;
}[] = [
  {
    key: "neckCm",
    label: "Pescoço",
  },
  {
    key: "shouldersCm",
    label: "Ombros",
  },
  {
    key: "chestCm",
    label: "Peitoral",
  },
  {
    key: "waistCm",
    label: "Cintura fina",
  },
  {
    key: "waistAtNavelCm",
    label: "Cintura no umbigo",
  },
  {
    key: "abdomenCm",
    label: "Abdômen",
  },
  {
    key: "hipCm",
    label: "Quadril",
  },
  {
    key: "rightArmRelaxedCm",
    label: "Braço direito relaxado",
  },
  {
    key: "leftArmRelaxedCm",
    label: "Braço esquerdo relaxado",
  },
  {
    key: "rightArmFlexedCm",
    label: "Braço direito contraído",
  },
  {
    key: "leftArmFlexedCm",
    label: "Braço esquerdo contraído",
  },
  {
    key: "rightThighCm",
    label: "Coxa direita",
  },
  {
    key: "leftThighCm",
    label: "Coxa esquerda",
  },
  {
    key: "rightCalfCm",
    label: "Panturrilha direita",
  },
  {
    key: "leftCalfCm",
    label: "Panturrilha esquerda",
  },
];

const skinfoldFields: {
  key: keyof PhysicalAssessmentSkinfoldInput;
  label: string;
}[] = [
  {
    key: "chestMm",
    label: "Peitoral",
  },
  {
    key: "abdomenMm",
    label: "Abdômen",
  },
  {
    key: "thighMm",
    label: "Coxa",
  },
  {
    key: "tricepsMm",
    label: "Tríceps",
  },
  {
    key: "subscapularMm",
    label: "Subescapular",
  },
  {
    key: "suprailiacMm",
    label: "Supra-ilíaca",
  },
  {
    key: "midaxillaryMm",
    label: "Axilar média",
  },
];

function localDateKey() {
  const now = new Date();

  const year = now.getFullYear();

  const month = String(now.getMonth() + 1).padStart(2, "0");

  const day = String(now.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function emptyTapeForm(): TapeForm {
  return {
    neckCm: "",
    shouldersCm: "",
    chestCm: "",
    waistCm: "",
    waistAtNavelCm: "",
    abdomenCm: "",
    hipCm: "",
    rightArmRelaxedCm: "",
    leftArmRelaxedCm: "",
    rightArmFlexedCm: "",
    leftArmFlexedCm: "",
    rightThighCm: "",
    leftThighCm: "",
    rightCalfCm: "",
    leftCalfCm: "",
  };
}

function emptySkinfoldForm(): SkinfoldForm {
  return {
    chestMm: "",
    abdomenMm: "",
    thighMm: "",
    tricepsMm: "",
    subscapularMm: "",
    suprailiacMm: "",
    midaxillaryMm: "",
  };
}

function valueToInput(value: NumericFormValue) {
  if (value === null || value === undefined) {
    return "";
  }

  return String(value);
}

function parseOptionalNumber(value: string): number | null {
  const normalized = value.trim().replace(",", ".");

  if (!normalized) return null;

  const number = Number(normalized);

  return Number.isFinite(number) ? number : null;
}

function formatDate(value: string) {
  const [year, month, day] = value.split("-");

  if (!year || !month || !day) {
    return value;
  }

  return `${day}/${month}/${year}`;
}

function formatNumber(value: number | null | undefined, suffix = "") {
  if (value === null || value === undefined) {
    return "—";
  }

  return `${value.toLocaleString("pt-BR", {
    maximumFractionDigits: 2,
  })}${suffix}`;
}

function bytesToSize(bytes: number) {
  if (bytes < 1024) {
    return `${bytes} B`;
  }

  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }

  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export default function PhysicalAssessmentPage({ route }: { route: string }) {
  const showForm = route === "#/avaliacao/nova" || route.includes("/editar/");
  const showComparison = route === "#/avaliacao/comparacao";
  const [composition, setComposition] = useState<BodyCompositionResult | null>(null);
  const [assessments, setAssessments] = useState<PhysicalAssessmentSummary[]>(
    [],
  );

  const [selectedAssessment, setSelectedAssessment] =
    useState<PhysicalAssessment | null>(null);

  const [photos, setPhotos] = useState<PhysicalAssessmentPhoto[]>([]);

  const [loading, setLoading] = useState(true);

  const [saving, setSaving] = useState(false);

  const [deleting, setDeleting] = useState(false);

  const [photoLoadingType, setPhotoLoadingType] =
    useState<PhysicalAssessmentPhotoType | null>(null);

  const [error, setError] = useState<string | null>(null);

  const [success, setSuccess] = useState<string | null>(null);

  const [editingId, setEditingId] = useState<number | null>(null);

  const [assessmentDate, setAssessmentDate] = useState(localDateKey());

  const [weightKg, setWeightKg] = useState("");

  const [heightCm, setHeightCm] = useState("");

  const [notes, setNotes] = useState("");

  const [tape, setTape] = useState<TapeForm>(emptyTapeForm());

  const [useSkinfolds, setUseSkinfolds] = useState(false);

  const [skinfold, setSkinfold] = useState<SkinfoldForm>(emptySkinfoldForm());

  const isEditing = editingId !== null;

  const selectedSummary = useMemo(
    () =>
      assessments.find(
        (assessment) => assessment.id === selectedAssessment?.id,
      ) ?? null,
    [assessments, selectedAssessment],
  );

  const startEdit = useCallback((assessment: PhysicalAssessment) => {
    window.location.hash = `#/avaliacao/editar/${assessment.id}`;
    setEditingId(assessment.id);

    setAssessmentDate(assessment.assessmentDate);

    setWeightKg(valueToInput(assessment.weightKg));

    setHeightCm(valueToInput(assessment.heightCm));

    setNotes(assessment.notes ?? "");

    const nextTape = emptyTapeForm();

    for (const field of tapeFields) {
      nextTape[field.key] = valueToInput(
        assessment.tapeMeasurements[field.key],
      );
    }

    setTape(nextTape);

    if (assessment.skinfoldMeasurements) {
      const nextSkinfold = emptySkinfoldForm();

      for (const field of skinfoldFields) {
        nextSkinfold[field.key] = valueToInput(
          assessment.skinfoldMeasurements[field.key],
        );
      }

      setSkinfold(nextSkinfold);

      setUseSkinfolds(true);
    } else {
      setSkinfold(emptySkinfoldForm());

      setUseSkinfolds(false);
    }

    setError(null);
    setSuccess(null);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function initialize() {
      try {
        setLoading(true);
        const data = (await physicalAssessmentService.getAll()).sort((a,b) => b.assessmentDate.localeCompare(a.assessmentDate) || b.id-a.id);

        if (cancelled) return;

        setAssessments(data);

        if (data.length > 0 && route !== "#/avaliacao/nova" && route !== "#/avaliacao/comparacao") {
          const routeId = Number(route.split("/").at(-1));
          const target = routeId || data[0].id;
          const [assessment, assessmentPhotos] = await Promise.all([
            physicalAssessmentService.getById(target),

            physicalAssessmentService.getPhotos(target),
          ]);

          if (cancelled) return;

          setSelectedAssessment(assessment);

          setPhotos(assessmentPhotos);
          if (route.includes("/editar/")) startEdit(assessment);
        }
      } catch (error) {
        if (cancelled) return;

        setError(
          error instanceof Error
            ? error.message
            : "Não foi possível carregar as avaliações.",
        );
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void initialize();

    return () => {
      cancelled = true;
    };
  }, [route, startEdit]);

  useEffect(() => {
    let cancelled = false;
    if (!selectedAssessment) return;
    bodyCompositionService.getAssessmentComposition(selectedAssessment.id).then(value => { if (!cancelled) setComposition(value); }).catch(() => { if (!cancelled) setComposition(null); });
    return () => { cancelled = true; };
  }, [selectedAssessment]);

  async function openAssessment(id: number) {
    window.location.hash = `#/avaliacao/${id}`;
  }

  function startNewAssessment() {
    window.location.hash = "#/avaliacao/nova";
    setEditingId(null);

    setAssessmentDate(localDateKey());

    setWeightKg("");
    setHeightCm("");
    setNotes("");

    setTape(emptyTapeForm());

    setUseSkinfolds(false);

    setSkinfold(emptySkinfoldForm());

    setSelectedAssessment(null);

    setPhotos([]);

    setError(null);
    setSuccess(null);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }


  function buildPayload(): PhysicalAssessmentInput | null {
    const parsedWeight = parseOptionalNumber(weightKg);

    if (parsedWeight === null || parsedWeight <= 0) {
      setError("Informe um peso válido.");

      return null;
    }

    if (!assessmentDate) {
      setError("Informe a data da avaliação.");

      return null;
    }

    const tapePayload: PhysicalAssessmentTapeInput = {};

    for (const field of tapeFields) {
      tapePayload[field.key] = parseOptionalNumber(tape[field.key]);
    }

    let skinfoldPayload: PhysicalAssessmentSkinfoldInput | null = null;

    if (useSkinfolds) {
      skinfoldPayload = {};

      for (const field of skinfoldFields) {
        skinfoldPayload[field.key] = parseOptionalNumber(skinfold[field.key]);
      }
    }

    return {
      assessmentDate,

      weightKg: parsedWeight,

      heightCm: parseOptionalNumber(heightCm),

      notes: notes.trim() || null,

      tapeMeasurements: tapePayload,

      skinfoldMeasurements: skinfoldPayload,
    };
  }

  async function saveAssessment() {
    setError(null);
    setSuccess(null);

    const payload = buildPayload();

    if (!payload) return;

    setSaving(true);

    try {
      let saved: PhysicalAssessment;

      if (editingId !== null) {
        saved = await physicalAssessmentService.update(editingId, payload);

        setSuccess("Avaliação atualizada com sucesso.");
      } else {
        saved = await physicalAssessmentService.create(payload);

        setSuccess("Avaliação criada com sucesso.");
      }

      setEditingId(saved.id);

      setSelectedAssessment(saved);

      const [updatedList, updatedPhotos] = await Promise.all([
        physicalAssessmentService.getAll(),

        physicalAssessmentService.getPhotos(saved.id),
      ]);

      setAssessments(updatedList);

      setPhotos(updatedPhotos);
      window.location.hash = `#/avaliacao/editar/${saved.id}`;
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  async function deleteAssessment() {
    if (!selectedAssessment) {
      return;
    }

    const confirmed = window.confirm(
      "Excluir esta avaliação física? As medidas, adipometria e fotos relacionadas também serão removidas.",
    );

    if (!confirmed) return;

    setDeleting(true);
    setError(null);
    setSuccess(null);

    try {
      await physicalAssessmentService.remove(selectedAssessment.id);

      const remaining = assessments.filter(
        (assessment) => assessment.id !== selectedAssessment.id,
      );

      setAssessments(remaining);

      setSelectedAssessment(null);

      setPhotos([]);
      setEditingId(null);

      setSuccess("Avaliação excluída.");

      if (remaining.length > 0) {
        await openAssessment(remaining[0].id);
      } else {
        window.location.hash = "#/avaliacao";
      }
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setDeleting(false);
    }
  }

  async function uploadPhoto(
    type: PhysicalAssessmentPhotoType,
    file: File | null,
  ) {
    if (!file || !selectedAssessment) {
      return;
    }

    setPhotoLoadingType(type);

    setError(null);

    try {
      await physicalAssessmentService.uploadPhoto(
        selectedAssessment.id,
        type,
        file,
      );

      const updatedPhotos = await physicalAssessmentService.getPhotos(
        selectedAssessment.id,
      );

      setPhotos(updatedPhotos);

      const updatedList = await physicalAssessmentService.getAll();

      setAssessments(updatedList);

      setSuccess("Foto salva com sucesso.");
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setPhotoLoadingType(null);
    }
  }

  async function deletePhoto(type: PhysicalAssessmentPhotoType) {
    if (!selectedAssessment) {
      return;
    }

    const confirmed = window.confirm("Excluir esta foto?");

    if (!confirmed) return;

    setPhotoLoadingType(type);

    setError(null);

    try {
      await physicalAssessmentService.deletePhoto(selectedAssessment.id, type);

      const updatedPhotos = await physicalAssessmentService.getPhotos(
        selectedAssessment.id,
      );

      setPhotos(updatedPhotos);

      const updatedList = await physicalAssessmentService.getAll();

      setAssessments(updatedList);

      setSuccess("Foto excluída.");
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setPhotoLoadingType(null);
    }
  }

  if (loading) {
    return (
      <div className="p-6 text-sm text-muted">
        Carregando avaliações...
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-10">
      {route !== "#/avaliacao" && <a className="dash-secondary" href="#/avaliacao">← Todas as avaliações</a>}
      {!showForm && !showComparison && <header className="flex flex-col gap-4 border-b border-border pb-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">
            Evolução corporal
          </p>

          <h2 className="mt-2 text-2xl font-semibold text-foreground">
            {showComparison ? "Comparação e evolução" : showForm ? (isEditing ? "Editar avaliação" : "Nova avaliação") : "Suas avaliações"}
          </h2>

          <p className="mt-2 max-w-2xl text-sm text-muted">
            Registre peso, medidas, adipometria e fotos para acompanhar sua
            evolução.
          </p>
        </div>

        <button
          type="button"
          onClick={startNewAssessment}
          className="rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-foreground transition hover:bg-accent"
        >
          Nova avaliação
        </button>
      </header>}

      {error && (
        <div className="rounded-lg border border-red-900/70 bg-red-950/30 px-4 py-3 text-sm text-red-300">
          {error}
          <button className="dash-secondary ml-3" onClick={() => window.location.reload()}>Tentar novamente</button>
        </div>
      )}

      {success && (
        <div className="rounded-lg border border-border bg-surface px-4 py-3 text-sm text-foreground">
          {success}
        </div>
      )}

      {showComparison ? <PhysicalAssessmentAnalytics assessments={assessments} /> : <>
        {showForm ? <div className="assessment-form">          <div className="rounded-[20px] border border-border bg-card p-4 sm:p-6">
            <div className="mb-5 flex items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-foreground">
                  {isEditing ? "Editar avaliação" : "Nova avaliação"}
                </h2>

                <p className="mt-1 text-sm text-muted">
                  Campos de medidas são opcionais.
                </p>
              </div>

              {isEditing && (
                <button
                  type="button"
                  onClick={() => { window.location.hash = "#/avaliacao"; }}
                  className="text-sm text-muted transition hover:text-foreground"
                >
                  Cancelar edição
                </button>
              )}
            </div>

            <h3 className="mb-4">Dados gerais e composição corporal</h3><p className="progress-muted mb-4">Peso e altura alimentam os cálculos existentes. Gordura e massa magra são estimadas com o perfil e as sete dobras.</p>
            <div className="grid gap-4 sm:grid-cols-3">
              <Field>
                <FieldLabel>Data</FieldLabel>

                <input
                  type="date"
                  max={localDateKey()}
                  value={assessmentDate}
                  onChange={(event) => setAssessmentDate(event.target.value)}
                  className={inputClassName}
                />
              </Field>

              <Field>
                <FieldLabel>Peso (kg)</FieldLabel>

                <NumericInput
                  value={weightKg}
                  onChange={setWeightKg}
                  placeholder="91,8"
                />
              </Field>

              <Field>
                <FieldLabel>Altura (cm)</FieldLabel>

                <NumericInput
                  value={heightCm}
                  onChange={setHeightCm}
                  placeholder="187"
                />
              </Field>
            </div>


          </div>

          <div className="rounded-[20px] border border-border bg-card p-4 sm:p-6">
            <div className="mb-5">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">
                Fita métrica
              </p>

              <h2 className="mt-2 text-lg font-semibold text-foreground">
                Circunferências
              </h2>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {tapeFields.map((field) => (
                <Field key={field.key}>
                  <FieldLabel>{field.label} (cm)</FieldLabel>

                  <NumericInput
                    value={tape[field.key]}
                    onChange={(value) =>
                      setTape((current) => ({
                        ...current,
                        [field.key]: value,
                      }))
                    }
                  />
                </Field>
              ))}
            </div>
          </div>

          <div className="rounded-[20px] border border-border bg-card p-4 sm:p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">
                  Adipômetro
                </p>

                <h2 className="mt-2 text-lg font-semibold text-foreground">
                  Dobras cutâneas
                </h2>

                <p className="mt-1 text-sm text-muted">Opcional.</p>
              </div>

              <button
                type="button"
                onClick={() => setUseSkinfolds((value) => !value)}
                className={`rounded-lg border px-4 py-2 text-sm font-medium transition ${
                  useSkinfolds
                    ? "border-accent bg-primary text-foreground"
                    : "border-border text-foreground hover:border-border"
                }`}
              >
                {useSkinfolds ? "Adipometria ativa" : "Adicionar adipometria"}
              </button>
            </div>

            {useSkinfolds && (
              <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {skinfoldFields.map((field) => (
                  <Field key={field.key}>
                    <FieldLabel>{field.label} (mm)</FieldLabel>

                    <NumericInput
                      value={skinfold[field.key]}
                      onChange={(value) =>
                        setSkinfold((current) => ({
                          ...current,
                          [field.key]: value,
                        }))
                      }
                    />
                  </Field>
                ))}
              </div>
            )}
          </div>

          <div className="dash-panel"><h2 className="mb-4">Observações</h2>            <div className="mt-4">
              <Field>
                <FieldLabel>Observações</FieldLabel>

                <textarea
                  value={notes}
                  onChange={(event) => setNotes(event.target.value)}
                  rows={3}
                  maxLength={2000}
                  placeholder="Jejum, horário da avaliação, observações gerais..."
                  className={`${inputClassName} resize-y`}
                />
              </Field>
            </div></div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              disabled={saving}
              onClick={() => void saveAssessment()}
              className="rounded-lg bg-primary px-5 py-3 text-sm font-semibold text-foreground transition hover:bg-accent disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving
                ? "Salvando..."
                : isEditing
                  ? "Salvar alterações"
                  : "Salvar avaliação"}
            </button>

            {isEditing && (
              <button
                type="button"
                onClick={startNewAssessment}
                className="rounded-lg border border-border px-5 py-3 text-sm font-semibold text-foreground transition hover:border-border hover:text-foreground"
              >
                Nova avaliação
              </button>
            )}
          </div>

{!selectedAssessment && <div className="dash-panel"><h2>Fotos</h2><p className="progress-muted">Salve a avaliação para enviar fotos. O envio precisa do registro salvo e mantém a privacidade atual.</p></div>}{selectedAssessment && <AssessmentPhotos photos={photos} editable={showForm} busyType={photoLoadingType} onUpload={uploadPhoto} onDelete={deletePhoto} />}

</div> : <>
          <div className="assessment-layout">          {selectedAssessment && (
            <div className="assessment-detail dash-panel">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">
                    {selectedAssessment.id === assessments[0]?.id ? "Última avaliação" : "Avaliação selecionada"}
                  </p>

                  <h2 className="mt-2 text-xl font-semibold text-foreground">
                    {formatDate(selectedAssessment.assessmentDate)}
                  </h2>
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => startEdit(selectedAssessment)}
                    className="rounded-lg border border-border px-3 py-2 text-sm text-foreground transition hover:border-border hover:text-foreground"
                  >
                    Editar
                  </button>

                  <button
                    type="button"
                    disabled={deleting}
                    onClick={() => void deleteAssessment()}
                    className="rounded-lg border border-red-950 px-3 py-2 text-sm text-red-400 transition hover:border-red-800 disabled:opacity-50"
                  >
                    {deleting ? "Excluindo..." : "Excluir"}
                  </button>
                </div>
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <Metric
                  label="Peso"
                  value={formatNumber(selectedAssessment.weightKg, " kg")}
                />

                <Metric
                  label="Altura"
                  value={formatNumber(selectedAssessment.heightCm, " cm")}
                />

                <Metric
                  label="Cintura"
                  value={formatNumber(
                    selectedAssessment.tapeMeasurements.waistCm,
                    " cm",
                  )}
                />

                <Metric
                  label="Abdômen"
                  value={formatNumber(
                    selectedAssessment.tapeMeasurements.abdomenCm,
                    " cm",
                  )}
                />
              </div>

              <div className="mt-4 progress-grid">
                <Metric label="IMC" value={formatNumber(composition?.assessmentId === selectedAssessment.id ? composition.bmi : null)} />
                <Metric label="Gordura estimada" value={formatNumber(composition?.assessmentId === selectedAssessment.id ? composition.bodyFatPercentage : null, "%")} />
                <Metric label="Massa magra estimada" value={formatNumber(composition?.assessmentId === selectedAssessment.id ? composition.leanMassKg : null, " kg")} />
              </div>
              <p className="progress-muted mt-3">Estimativas usam o protocolo existente de sete dobras e o perfil corporal. Valores indisponíveis aparecem como —.</p>
              <details className="mt-6"><summary>Medidas e dobras cadastradas</summary><div>
                <h3 className="text-sm font-semibold text-foreground">Medidas</h3>

                <div className="mt-3 grid gap-x-8 gap-y-3 sm:grid-cols-2">
                  {tapeFields.filter(field => selectedAssessment.tapeMeasurements[field.key] !== null).map((field) => (
                    <MeasurementRow
                      key={field.key}
                      label={field.label}
                      value={formatNumber(
                        selectedAssessment.tapeMeasurements[field.key],
                        " cm",
                      )}
                    />
                  ))}
                </div>
              </div>

              {selectedAssessment.skinfoldMeasurements && (
                <div className="mt-7 border-t border-border pt-6">
                  <h3 className="text-sm font-semibold text-foreground">
                    Dobras cutâneas
                  </h3>

                  <div className="mt-3 grid gap-x-8 gap-y-3 sm:grid-cols-2">
                    {skinfoldFields.filter(field => selectedAssessment.skinfoldMeasurements?.[field.key] != null).map((field) => (
                      <MeasurementRow
                        key={field.key}
                        label={field.label}
                        value={formatNumber(
                          selectedAssessment.skinfoldMeasurements?.[field.key],
                          " mm",
                        )}
                      />
                    ))}
                  </div>
                </div>
              )}

              </details>
              {selectedAssessment.notes && (
                <div className="mt-7 border-t border-border pt-6">
                  <h3 className="text-sm font-semibold text-foreground">
                    Observações
                  </h3>

                  <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-muted">
                    {selectedAssessment.notes}
                  </p>
                </div>
              )}
            </div>
          )}{selectedAssessment && <AssessmentPhotos photos={photos} editable={false} busyType={photoLoadingType} onUpload={uploadPhoto} onDelete={deletePhoto} />}

</div>
                  <section>
          <div className="rounded-[20px] border border-border bg-card p-4">
            <div className="mb-4">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">
                Histórico
              </p>

              <h2 className="mt-2 text-lg font-semibold text-foreground">
                Avaliações
              </h2>
            </div>

            {assessments.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted">
                Nenhuma avaliação registrada.
              </p>
            ) : (
              <div className="progress-grid">
                {assessments.map((assessment) => {
                  const active = selectedAssessment?.id === assessment.id;

                  return (
                    <button
                      type="button"
                      key={assessment.id}
                      onClick={() => void openAssessment(assessment.id)}
                      className={`w-full rounded-lg border p-3 text-left transition ${
                        active
                          ? "border-accent bg-primary text-foreground"
                          : "border-border bg-background text-foreground hover:border-border"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold">
                            {formatDate(assessment.assessmentDate)}
                          </p>

                          <p
                            className={`mt-1 text-xs ${
                              active ? "text-muted" : "text-muted"
                            }`}
                          >
                            {formatNumber(assessment.weightKg, " kg")}
                          </p>
                        </div>

                        <span
                          className={`text-xs ${
                            active ? "text-muted" : "text-muted"
                          }`}
                        >
                          {assessment.photoCount} foto
                          {assessment.photoCount === 1 ? "" : "s"}
                        </span>
                      </div>

                      <div
                        className={`mt-3 flex gap-3 text-xs ${
                          active ? "text-muted" : "text-muted"
                        }`}
                      >
                        <span>
                          Cintura {formatNumber(assessment.waistCm, " cm")}
                        </span>

                        <span>
                          Abd. {formatNumber(assessment.abdomenCm, " cm")}
                        </span>
                      </div>

                      {assessment.hasSkinfoldMeasurements && (
                        <p
                          className={`mt-2 text-[11px] font-medium uppercase tracking-wide ${
                            active ? "text-muted" : "text-muted"
                          }`}
                        >
                          Com adipometria
                        </p>
                      )}
                    </button>
                  );
                })}
              </div>
            )}

            {selectedSummary && (
              <p className="mt-4 border-t border-border pt-4 text-xs leading-5 text-muted">
                O peso desta avaliação também fica sincronizado com o histórico
                de peso corporal.
              </p>
            )}
          </div>
        </section>
          <a className="dash-secondary" href="#/avaliacao/comparacao">Comparação e evolução →</a>
        </>}
      </>}
    </div>
  );
}

function Field({ children }: { children: React.ReactNode }) {
  return <label className="block space-y-1.5">{children}</label>;
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <span className="text-xs font-medium text-muted">{children}</span>
  );
}

function NumericInput({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <input
      type="text"
      inputMode="decimal"
      value={value}
      placeholder={placeholder}
      onChange={(event) => onChange(event.target.value)}
      className={inputClassName}
    />
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-background p-3">
      <p className="text-xs text-muted">{label}</p>

      <p className="mt-1 text-lg font-semibold text-foreground">{value}</p>
    </div>
  );
}

function MeasurementRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-border pb-2 text-sm">
      <span className="text-muted">{label}</span>

      <span className="font-medium text-foreground">{value}</span>
    </div>
  );
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  return "Não foi possível concluir a operação.";
}

const inputClassName =
  "w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground outline-none transition placeholder:text-muted focus:border-border";

function AssessmentPhotos({ photos, editable, busyType, onUpload, onDelete }: { photos: PhysicalAssessmentPhoto[]; editable: boolean; busyType: PhysicalAssessmentPhotoType | null; onUpload: (type: PhysicalAssessmentPhotoType, file: File | null) => Promise<void>; onDelete: (type: PhysicalAssessmentPhotoType) => Promise<void> }) {
 if (!editable && !photos.length) return <section className="dash-panel"><h2>Fotos</h2><p className="progress-muted mt-3">Nenhuma foto cadastrada nesta avaliação. Use Editar para adicionar o registro visual.</p></section>;
 return (<div className="assessment-photos dash-panel">
              <div className="mb-5">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">
                  Fotos de evolução
                </p>

                <h2 className="mt-2 text-lg font-semibold text-foreground">
                  Registro visual
                </h2>

                <p className="mt-1 text-sm text-muted">
                  As fotos são opcionais e armazenadas de forma privada.
                </p>
              </div>

              <div className="photo-grid">
                {photoTypes.filter(type => editable || photos.some(photo => photo.type === type.type)).map((photoType) => {
                  const photo = photos.find(item => item.type === photoType.type);

                  const busy = busyType === photoType.type;

                  return (
                    <div
                      key={photoType.type}
                      className="overflow-hidden rounded-[20px] border border-border bg-background"
                    >
                      <div className="flex items-center justify-center overflow-hidden bg-card">
                        {photo ? (
                          <a
                            href={photo.url}
                            target="_blank"
                            rel="noreferrer"
                            className="block h-full w-full"
                          >
                            <img
                              src={photo.url}
                              alt={photoType.label}
                              className="h-full w-full object-contain"
                            />
                          </a>
                        ) : (
                          <span className="px-6 text-center text-sm text-muted">
                            Nenhuma foto
                          </span>
                        )}
                      </div>

                      <div className="space-y-3 p-4">
                        <div>
                          <p className="font-medium text-foreground">
                            {photoType.label}
                          </p>

                          {photo && (
                            <p className="mt-1 text-xs text-muted">
                              {bytesToSize(photo.sizeBytes)}
                            </p>
                          )}
                        </div>

                        {editable && <div className="flex flex-wrap gap-2">
                          <label className="inline-flex min-h-11 items-center cursor-pointer rounded-[20px] bg-primary px-3 py-2 text-xs font-semibold text-foreground transition hover:bg-accent">
                            {busy
                              ? "Enviando..."
                              : photo
                                ? "Substituir"
                                : "Enviar foto"}

                            <input
                              type="file"
                              accept="image/jpeg,image/png,image/webp"
                              disabled={busy}
                              onChange={(event) => {
                                const file = event.target.files?.[0] ?? null;

                                void onUpload(photoType.type, file);

                                event.target.value = "";
                              }}
                              className="hidden"
                            />
                          </label>

                          {photo && (
                            <button
                              type="button"
                              disabled={busy}
                              onClick={() => void onDelete(photoType.type)}
                              className="rounded-lg border border-border px-3 py-2 text-xs font-semibold text-foreground transition hover:border-red-800 hover:text-red-300"
                            >
                              Excluir
                            </button>
                          )}
                        </div>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>);
}

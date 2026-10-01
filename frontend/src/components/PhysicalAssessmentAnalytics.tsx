import { useEffect, useMemo, useState } from "react";

import { bodyCompositionService } from "../services/bodyCompositionService";
import { physicalAssessmentService } from "../services/physicalAssessmentService";

import type {
  BiologicalSex,
  BodyCompositionComparison,
  BodyCompositionProfile,
  PhysicalAssessmentEvolution,
} from "../types/bodyComposition";

import type {
  PhysicalAssessment,
  PhysicalAssessmentPhoto,
  PhysicalAssessmentPhotoType,
  PhysicalAssessmentSummary,
} from "../types/physicalAssessment";

interface Props {
  assessments: PhysicalAssessmentSummary[];
}

const photoTypes: {
  type: PhysicalAssessmentPhotoType;
  label: string;
}[] = [
  { type: 0, label: "Frente" },
  { type: 1, label: "Costas" },
  { type: 2, label: "Lateral esquerda" },
  { type: 3, label: "Lateral direita" },
];

const tapeFields: {
  key:
    | "neckCm"
    | "shouldersCm"
    | "chestCm"
    | "waistCm"
    | "waistAtNavelCm"
    | "abdomenCm"
    | "hipCm"
    | "rightArmRelaxedCm"
    | "leftArmRelaxedCm"
    | "rightArmFlexedCm"
    | "leftArmFlexedCm"
    | "rightThighCm"
    | "leftThighCm"
    | "rightCalfCm"
    | "leftCalfCm";
  label: string;
}[] = [
  { key: "neckCm", label: "Pescoço" },
  { key: "shouldersCm", label: "Ombros" },
  { key: "chestCm", label: "Peitoral" },
  { key: "waistCm", label: "Cintura fina" },
  { key: "waistAtNavelCm", label: "Cintura no umbigo" },
  { key: "abdomenCm", label: "Abdômen" },
  { key: "hipCm", label: "Quadril" },
  { key: "rightArmRelaxedCm", label: "Braço D relaxado" },
  { key: "leftArmRelaxedCm", label: "Braço E relaxado" },
  { key: "rightArmFlexedCm", label: "Braço D contraído" },
  { key: "leftArmFlexedCm", label: "Braço E contraído" },
  { key: "rightThighCm", label: "Coxa direita" },
  { key: "leftThighCm", label: "Coxa esquerda" },
  { key: "rightCalfCm", label: "Panturrilha direita" },
  { key: "leftCalfCm", label: "Panturrilha esquerda" },
];

const skinfoldFields: {
  key:
    | "chestMm"
    | "abdomenMm"
    | "thighMm"
    | "tricepsMm"
    | "subscapularMm"
    | "suprailiacMm"
    | "midaxillaryMm";
  label: string;
}[] = [
  { key: "chestMm", label: "Peitoral" },
  { key: "abdomenMm", label: "Abdômen" },
  { key: "thighMm", label: "Coxa" },
  { key: "tricepsMm", label: "Tríceps" },
  { key: "subscapularMm", label: "Subescapular" },
  { key: "suprailiacMm", label: "Supra-ilíaca" },
  { key: "midaxillaryMm", label: "Axilar média" },
];

export default function PhysicalAssessmentAnalytics({ assessments }: Props) {
  const [profile, setProfile] = useState<BodyCompositionProfile | null>(null);

  const [birthDate, setBirthDate] = useState("");

  const [biologicalSex, setBiologicalSex] = useState<BiologicalSex>(0);

  const [evolution, setEvolution] =
    useState<PhysicalAssessmentEvolution | null>(null);

  const [firstId, setFirstId] = useState<number | null>(null);

  const [secondId, setSecondId] = useState<number | null>(null);

  const [firstAssessment, setFirstAssessment] =
    useState<PhysicalAssessment | null>(null);

  const [secondAssessment, setSecondAssessment] =
    useState<PhysicalAssessment | null>(null);

  const [firstPhotos, setFirstPhotos] = useState<PhysicalAssessmentPhoto[]>([]);

  const [secondPhotos, setSecondPhotos] = useState<PhysicalAssessmentPhoto[]>(
    [],
  );

  const [comparison, setComparison] =
    useState<BodyCompositionComparison | null>(null);

  const [profileSaving, setProfileSaving] = useState(false);

  const [error, setError] = useState<string | null>(null);

  const [message, setMessage] = useState<string | null>(null);

  const assessmentSignature = useMemo(
    () =>
      assessments
        .map((item) => `${item.id}:${item.assessmentDate}:${item.weightKg}`)
        .join("|"),
    [assessments],
  );

  const defaultFirstId =
    assessments.length >= 2
      ? assessments[assessments.length - 1].id
      : (assessments[0]?.id ?? null);

  const defaultSecondId = assessments[0]?.id ?? null;

  const effectiveFirstId = firstId ?? defaultFirstId;

  const effectiveSecondId = secondId ?? defaultSecondId;

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const [loadedProfile, loadedEvolution] = await Promise.all([
          bodyCompositionService.getProfile(),
          bodyCompositionService.getEvolution(),
        ]);

        if (cancelled) return;

        setProfile(loadedProfile);

        setBirthDate(loadedProfile.birthDate ?? "");

        setBiologicalSex(loadedProfile.biologicalSex ?? 0);

        setEvolution(loadedEvolution);
      } catch (error) {
        if (cancelled) return;

        setError(getErrorMessage(error));
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, [assessmentSignature]);

  useEffect(() => {
    if (
      !effectiveFirstId ||
      !effectiveSecondId ||
      effectiveFirstId === effectiveSecondId
    ) {
      return;
    }

    let cancelled = false;

    async function loadComparison() {
      try {
        const [
          loadedComparison,
          loadedFirst,
          loadedSecond,
          loadedFirstPhotos,
          loadedSecondPhotos,
        ] = await Promise.all([
          bodyCompositionService.compare(effectiveFirstId!, effectiveSecondId!),

          physicalAssessmentService.getById(effectiveFirstId!),

          physicalAssessmentService.getById(effectiveSecondId!),

          physicalAssessmentService.getPhotos(effectiveFirstId!),

          physicalAssessmentService.getPhotos(effectiveSecondId!),
        ]);

        if (cancelled) return;

        setComparison(loadedComparison);

        setFirstAssessment(loadedFirst);

        setSecondAssessment(loadedSecond);

        setFirstPhotos(loadedFirstPhotos);

        setSecondPhotos(loadedSecondPhotos);
      } catch (error) {
        if (cancelled) return;

        setError(getErrorMessage(error));
      }
    }

    void loadComparison();

    return () => {
      cancelled = true;
    };
  }, [effectiveFirstId, effectiveSecondId, assessmentSignature]);

  async function saveProfile() {
    if (!birthDate) {
      setError("Informe sua data de nascimento.");

      return;
    }

    setProfileSaving(true);
    setError(null);
    setMessage(null);

    try {
      const updated = await bodyCompositionService.updateProfile({
        birthDate,
        biologicalSex,
      });

      setProfile(updated);

      const loadedEvolution = await bodyCompositionService.getEvolution();

      setEvolution(loadedEvolution);

      setMessage("Perfil corporal atualizado.");
    } catch (error) {
      setError(getErrorMessage(error));
    } finally {
      setProfileSaving(false);
    }
  }

  const canCompare =
    assessments.length >= 2 &&
    effectiveFirstId !== null &&
    effectiveSecondId !== null &&
    effectiveFirstId !== effectiveSecondId;

  return (
    <section className="space-y-6">
      <header className="border-b border-neutral-800 pb-5">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-500">
          Analytics corporal
        </p>

        <h2 className="mt-2 text-2xl font-semibold text-white">
          Comparação & Evolução
        </h2>

        <p className="mt-2 max-w-3xl text-sm text-neutral-400">
          Compare avaliações, acompanhe medidas, composição corporal e evolução
          visual.
        </p>
      </header>

      {error && <Notice>{error}</Notice>}

      {message && <Notice>{message}</Notice>}

      <div className="rounded-xl border border-neutral-800 bg-neutral-950 p-4 sm:p-6">
        <h3 className="text-lg font-semibold text-white">
          Perfil para composição corporal
        </h3>

        <p className="mt-1 text-sm text-neutral-500">
          Utilizado somente para calcular a estimativa pelo protocolo de dobras.
        </p>

        <div className="mt-5 grid gap-4 sm:grid-cols-3">
          <div>
            <Label>Data de nascimento</Label>

            <input
              type="date"
              value={birthDate}
              onChange={(event) => setBirthDate(event.target.value)}
              className={inputClass}
            />
          </div>

          <div>
            <Label>Sexo biológico usado pelo protocolo</Label>

            <select
              value={biologicalSex}
              onChange={(event) =>
                setBiologicalSex(Number(event.target.value) as BiologicalSex)
              }
              className={inputClass}
            >
              <option value={0}>Masculino</option>

              <option value={1}>Feminino</option>
            </select>
          </div>

          <div className="flex items-end">
            <button
              type="button"
              disabled={profileSaving}
              onClick={() => void saveProfile()}
              className="w-full rounded-lg bg-white px-4 py-2.5 text-sm font-semibold text-black transition hover:bg-neutral-200 disabled:opacity-50"
            >
              {profileSaving ? "Salvando..." : "Salvar perfil"}
            </button>
          </div>
        </div>

        {profile?.birthDate && profile.biologicalSex !== null && (
          <p className="mt-4 text-xs text-neutral-600">
            Perfil configurado. O percentual de gordura é uma estimativa, não um
            diagnóstico clínico.
          </p>
        )}
      </div>

      {evolution && evolution.points.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2">
          <TrendCard
            title="Peso"
            suffix=" kg"
            points={evolution.points.map((point) => ({
              date: point.assessmentDate,
              value: point.weightKg,
            }))}
          />

          <TrendCard
            title="Cintura"
            suffix=" cm"
            points={evolution.points.map((point) => ({
              date: point.assessmentDate,
              value: point.waistCm,
            }))}
          />

          <TrendCard
            title="Abdômen"
            suffix=" cm"
            points={evolution.points.map((point) => ({
              date: point.assessmentDate,
              value: point.abdomenCm,
            }))}
          />

          <TrendCard
            title="% de gordura"
            suffix="%"
            points={evolution.points.map((point) => ({
              date: point.assessmentDate,
              value: point.bodyFatPercentage,
            }))}
          />
        </div>
      )}

      <div className="rounded-xl border border-neutral-800 bg-neutral-950 p-4 sm:p-6">
        <h3 className="text-lg font-semibold text-white">
          Comparar avaliações
        </h3>

        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <div>
            <Label>Avaliação inicial</Label>

            <select
              value={effectiveFirstId ?? ""}
              onChange={(event) => setFirstId(Number(event.target.value))}
              className={inputClass}
            >
              {assessments
                .slice()
                .reverse()
                .map((assessment) => (
                  <option key={assessment.id} value={assessment.id}>
                    {formatDate(assessment.assessmentDate)} —{" "}
                    {assessment.weightKg} kg
                  </option>
                ))}
            </select>
          </div>

          <div>
            <Label>Avaliação final</Label>

            <select
              value={effectiveSecondId ?? ""}
              onChange={(event) => setSecondId(Number(event.target.value))}
              className={inputClass}
            >
              {assessments.map((assessment) => (
                <option key={assessment.id} value={assessment.id}>
                  {formatDate(assessment.assessmentDate)} —{" "}
                  {assessment.weightKg} kg
                </option>
              ))}
            </select>
          </div>
        </div>

        {!canCompare && (
          <p className="mt-4 text-sm text-neutral-500">
            Registre pelo menos duas avaliações e selecione datas diferentes.
          </p>
        )}
      </div>

      {canCompare && comparison && firstAssessment && secondAssessment && (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <ComparisonMetric
              label="Peso"
              first={comparison.first.weightKg}
              second={comparison.second.weightKg}
              difference={comparison.weightChangeKg}
              suffix=" kg"
            />

            <ComparisonMetric
              label="% gordura"
              first={comparison.first.bodyFatPercentage}
              second={comparison.second.bodyFatPercentage}
              difference={comparison.bodyFatChangePercentagePoints}
              suffix=" p.p."
              valueSuffix="%"
            />

            <ComparisonMetric
              label="Massa gorda"
              first={comparison.first.fatMassKg}
              second={comparison.second.fatMassKg}
              difference={comparison.fatMassChangeKg}
              suffix=" kg"
            />

            <ComparisonMetric
              label="Massa magra"
              first={comparison.first.leanMassKg}
              second={comparison.second.leanMassKg}
              difference={comparison.leanMassChangeKg}
              suffix=" kg"
            />

            <ComparisonMetric
              label="7 dobras"
              first={comparison.first.sevenSkinfoldSumMm}
              second={comparison.second.sevenSkinfoldSumMm}
              difference={comparison.sevenSkinfoldSumChangeMm}
              suffix=" mm"
            />
          </div>

          <ComparisonTable
            title="Circunferências"
            unit="cm"
            rows={tapeFields.map((field) => ({
              label: field.label,

              first: firstAssessment.tapeMeasurements[field.key],

              second: secondAssessment.tapeMeasurements[field.key],
            }))}
          />

          <ComparisonTable
            title="Dobras cutâneas"
            unit="mm"
            rows={skinfoldFields.map((field) => ({
              label: field.label,

              first: firstAssessment.skinfoldMeasurements?.[field.key] ?? null,

              second:
                secondAssessment.skinfoldMeasurements?.[field.key] ?? null,
            }))}
          />

          <PhotoComparison
            firstDate={firstAssessment.assessmentDate}
            secondDate={secondAssessment.assessmentDate}
            firstPhotos={firstPhotos}
            secondPhotos={secondPhotos}
          />

          <div className="rounded-xl border border-neutral-800 bg-neutral-950 p-4 text-xs leading-5 text-neutral-500 sm:p-6">
            Percentual de gordura calculado somente quando as sete dobras, idade
            e sexo biológico necessários ao protocolo estão disponíveis. Método:{" "}
            <span className="text-neutral-300">
              Jackson-Pollock 7 dobras + Siri
            </span>
            .
          </div>
        </>
      )}
    </section>
  );
}

function ComparisonMetric({
  label,
  first,
  second,
  difference,
  suffix,
  valueSuffix,
}: {
  label: string;
  first: number | null;
  second: number | null;
  difference: number | null;
  suffix: string;
  valueSuffix?: string;
}) {
  return (
    <div className="rounded-xl border border-neutral-800 bg-neutral-950 p-4">
      <p className="text-xs text-neutral-500">{label}</p>

      <p className="mt-2 text-lg font-semibold text-white">
        {formatValue(first, valueSuffix ?? suffix)}
        <span className="mx-2 text-neutral-700">→</span>
        {formatValue(second, valueSuffix ?? suffix)}
      </p>

      <p className="mt-2 text-xs text-neutral-500">
        Diferença:{" "}
        <span className="font-medium text-neutral-200">
          {formatDelta(difference, suffix)}
        </span>
      </p>
    </div>
  );
}

function ComparisonTable({
  title,
  unit,
  rows,
}: {
  title: string;
  unit: string;
  rows: {
    label: string;
    first: number | null;
    second: number | null;
  }[];
}) {
  return (
    <div className="rounded-xl border border-neutral-800 bg-neutral-950 p-4 sm:p-6">
      <h3 className="text-lg font-semibold text-white">{title}</h3>

      <div className="mt-5 overflow-x-auto">
        <table className="w-full min-w-[580px] text-sm">
          <thead>
            <tr className="border-b border-neutral-800 text-left text-xs uppercase tracking-wide text-neutral-600">
              <th className="pb-3">Medida</th>

              <th className="pb-3">Inicial</th>

              <th className="pb-3">Final</th>

              <th className="pb-3 text-right">Diferença</th>
            </tr>
          </thead>

          <tbody>
            {rows.map((row) => {
              const difference =
                row.first !== null && row.second !== null
                  ? row.second - row.first
                  : null;

              return (
                <tr key={row.label} className="border-b border-neutral-900">
                  <td className="py-3 text-neutral-400">{row.label}</td>

                  <td className="py-3 text-neutral-200">
                    {formatValue(row.first, ` ${unit}`)}
                  </td>

                  <td className="py-3 text-neutral-200">
                    {formatValue(row.second, ` ${unit}`)}
                  </td>

                  <td className="py-3 text-right font-medium text-white">
                    {formatDelta(difference, ` ${unit}`)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function PhotoComparison({
  firstDate,
  secondDate,
  firstPhotos,
  secondPhotos,
}: {
  firstDate: string;
  secondDate: string;
  firstPhotos: PhysicalAssessmentPhoto[];
  secondPhotos: PhysicalAssessmentPhoto[];
}) {
  return (
    <div className="rounded-xl border border-neutral-800 bg-neutral-950 p-4 sm:p-6">
      <h3 className="text-lg font-semibold text-white">Comparação visual</h3>

      <div className="mt-5 space-y-6">
        {photoTypes.map((photoType) => {
          const first = firstPhotos.find(
            (photo) => photo.type === photoType.type,
          );

          const second = secondPhotos.find(
            (photo) => photo.type === photoType.type,
          );

          return (
            <div key={photoType.type}>
              <p className="mb-3 text-sm font-medium text-neutral-300">
                {photoType.label}
              </p>

              <div className="grid gap-3 sm:grid-cols-2">
                <PhotoBox label={formatDate(firstDate)} photo={first} />

                <PhotoBox label={formatDate(secondDate)} photo={second} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function PhotoBox({
  label,
  photo,
}: {
  label: string;
  photo: PhysicalAssessmentPhoto | undefined;
}) {
  return (
    <div className="overflow-hidden rounded-lg border border-neutral-800 bg-black">
      <div className="flex aspect-[3/4] items-center justify-center overflow-hidden">
        {photo ? (
          <a
            href={photo.url}
            target="_blank"
            rel="noreferrer"
            className="h-full w-full"
          >
            <img
              src={photo.url}
              alt={label}
              className="h-full w-full object-cover"
            />
          </a>
        ) : (
          <span className="text-sm text-neutral-700">Sem foto</span>
        )}
      </div>

      <div className="border-t border-neutral-800 px-3 py-2 text-xs text-neutral-500">
        {label}
      </div>
    </div>
  );
}

function TrendCard({
  title,
  suffix,
  points,
}: {
  title: string;
  suffix: string;
  points: {
    date: string;
    value: number | null;
  }[];
}) {
  const valid = points.filter(
    (
      point,
    ): point is {
      date: string;
      value: number;
    } => point.value !== null,
  );

  return (
    <div className="rounded-xl border border-neutral-800 bg-neutral-950 p-4 sm:p-5">
      <h3 className="text-sm font-semibold text-white">{title}</h3>

      {valid.length < 2 ? (
        <p className="mt-6 text-sm text-neutral-600">Dados insuficientes.</p>
      ) : (
        <>
          <MiniLineChart points={valid} />

          <div className="mt-3 flex justify-between text-xs text-neutral-600">
            <span>{formatDate(valid[0].date)}</span>

            <span className="font-medium text-neutral-300">
              {formatValue(valid[valid.length - 1].value, suffix)}
            </span>

            <span>{formatDate(valid[valid.length - 1].date)}</span>
          </div>
        </>
      )}
    </div>
  );
}

function MiniLineChart({
  points,
}: {
  points: {
    date: string;
    value: number;
  }[];
}) {
  const width = 600;

  const height = 160;

  const padding = 12;

  const values = points.map((point) => point.value);

  const minimum = Math.min(...values);

  const maximum = Math.max(...values);

  const range = maximum - minimum || 1;

  const coordinates = points.map((point, index) => {
    const x =
      padding +
      (index / Math.max(points.length - 1, 1)) * (width - padding * 2);

    const y =
      height -
      padding -
      ((point.value - minimum) / range) * (height - padding * 2);

    return {
      x,
      y,
      value: point.value,
    };
  });

  const polyline = coordinates
    .map((point) => `${point.x},${point.y}`)
    .join(" ");

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="mt-4 h-40 w-full text-white"
      preserveAspectRatio="none"
    >
      <polyline
        points={polyline}
        fill="none"
        stroke="currentColor"
        strokeWidth="3"
        vectorEffect="non-scaling-stroke"
      />

      {coordinates.map((point, index) => (
        <circle
          key={index}
          cx={point.x}
          cy={point.y}
          r="4"
          fill="currentColor"
        />
      ))}
    </svg>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <label className="mb-1.5 block text-xs font-medium text-neutral-400">
      {children}
    </label>
  );
}

function Notice({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-neutral-800 bg-neutral-950 px-4 py-3 text-sm text-neutral-300">
      {children}
    </div>
  );
}

function formatDate(value: string) {
  const [year, month, day] = value.split("-");

  return year && month && day ? `${day}/${month}/${year}` : value;
}

function formatValue(value: number | null, suffix = "") {
  if (value === null) return "—";

  return `${value.toLocaleString("pt-BR", {
    maximumFractionDigits: 2,
  })}${suffix}`;
}

function formatDelta(value: number | null, suffix: string) {
  if (value === null) return "—";

  const prefix = value > 0 ? "+" : "";

  return `${prefix}${value.toLocaleString("pt-BR", {
    maximumFractionDigits: 2,
  })}${suffix}`;
}

function getErrorMessage(error: unknown) {
  return error instanceof Error
    ? error.message
    : "Não foi possível concluir a operação.";
}

const inputClass =
  "w-full rounded-lg border border-neutral-800 bg-black px-3 py-2.5 text-sm text-white outline-none transition focus:border-neutral-500";

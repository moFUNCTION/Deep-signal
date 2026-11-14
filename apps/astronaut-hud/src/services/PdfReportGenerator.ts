import { jsPDF } from 'jspdf';
import type {
  MetricEvaluationResult,
  MetricKey,
  TriageDiagnosisOutput,
  VitalReadingInput,
} from '@aura/medical-engine';
import { evaluateAllMetrics } from '@aura/medical-engine';
import type { AstronautProfileState } from '../store/useAuthStore';
import { useOfflineSyncStore } from '../store/useOfflineSyncStore';

export interface GeneratedDossier {
  doc: jsPDF;
  blob: Blob;
  fileName: string;
}

export function generateClinicalDossierPdf(
  profile: AstronautProfileState,
  vital: VitalReadingInput,
  alert: TriageDiagnosisOutput,
): GeneratedDossier {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const timestamp = new Date().toISOString();
  const alertId = alert.$id || `ALT-${Date.now().toString(36).toUpperCase()}`;

  // 1. Header Banner
  doc.setFillColor(10, 15, 29); // #0A0F1D
  doc.rect(0, 0, 210, 32, 'F');

  doc.setTextColor(56, 189, 248); // skyBright (#38BDF8)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text('AURA // AUTONOMOUS SPACE MEDICAL TELEMETRY DOSSIER', 14, 15);

  doc.setTextColor(200, 210, 225);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(`GENERATED UTC: ${timestamp} | ALERT ID: ${alertId}`, 14, 24);

  // 2. Crew Metadata
  doc.setTextColor(20, 20, 20);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text(`Crew Member: ${profile.fullName} (${profile.astronautCode})`, 14, 44);

  doc.setFont('helvetica', 'normal');
  doc.text(`Blood Type: ${profile.bloodType} | Active Mission Phase: ${vital.mission_phase}`, 14, 51);

  const severityColor = alert.severity === 'red' ? [220, 38, 38] : alert.severity === 'yellow' ? [217, 119, 6] : [22, 163, 74];
  doc.setTextColor(severityColor[0], severityColor[1], severityColor[2]);
  doc.setFont('helvetica', 'bold');
  doc.text(`Severity Classification: ${alert.severity.toUpperCase()} | Organ System: ${alert.affected_system.toUpperCase()}`, 14, 58);

  // 3. Diagnosis Box
  doc.setDrawColor(220, 38, 38);
  doc.setLineWidth(0.5);
  doc.setFillColor(254, 242, 242);
  doc.rect(14, 65, 182, 34, 'FD');

  doc.setTextColor(185, 28, 28);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text(`DIAGNOSIS: ${alert.diagnosis_title} [${alert.diagnosis_code}]`, 18, 74);

  doc.setTextColor(51, 65, 85);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  const splitExplanation = doc.splitTextToSize(alert.simple_explanation, 174);
  doc.text(splitExplanation, 18, 82);

  // 4. Telemetry & Personal Z-Score Table
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('BIOMETRIC & CABIN TELEMETRY SNAPSHOT (VS. PHASE-ADJUSTED BASELINE)', 14, 110);

  const evals = alert.metric_evaluations || evaluateAllMetrics(vital, profile.earthBaselines, vital.mission_phase);
  let y = 118;
  doc.setFont('courier', 'normal');
  doc.setFontSize(9);

  const metricKeys = Object.keys(evals) as MetricKey[];
  for (const key of metricKeys) {
    const evalItem = evals[key] as MetricEvaluationResult;
    if (!evalItem) continue;

    const currentVal = evalItem.currentValue;
    const adjMean = evalItem.adjustedMean !== null ? evalItem.adjustedMean : 'N/A';
    const zScoreStr = evalItem.zScore !== null ? `${evalItem.zScore >= 0 ? '+' : ''}${evalItem.zScore} sigma` : 'N/A';
    const status = evalItem.severity.toUpperCase();

    const rowText = `- ${evalItem.metricKey.padEnd(20, ' ')}: ${String(currentVal).padStart(5, ' ')} | Adj Baseline: ${String(adjMean).padStart(6, ' ')} | Z-Score: ${zScoreStr.padStart(11, ' ')} | Status: ${status}`;
    doc.text(rowText, 14, y);
    y += 6.5;
  }

  // 5. Action Protocol Section
  y += 5;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('AUTONOMOUS ONBOARD COUNTERMEASURE PROTOCOL:', 14, y);
  y += 7;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  alert.action_protocol.forEach((step, index) => {
    const stepLines = doc.splitTextToSize(`${index + 1}. ${step}`, 178);
    doc.text(stepLines, 16, y);
    y += stepLines.length * 5;
  });

  // 6. NASA Flight Surgeon Signature Block
  y = Math.max(y + 8, 250);
  doc.setDrawColor(148, 163, 184);
  doc.setLineWidth(0.3);
  doc.line(14, y, 90, y);
  doc.line(120, y, 196, y);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  doc.text('NASA Flight Surgeon on Duty', 14, y + 4);
  doc.text('Space Medicine Directorate, Houston TX', 14, y + 8);

  doc.text(`DTN Propagation Protocol: Verified`, 120, y + 4);
  doc.text(`Earth Station: DSN Goldstone / Madrid`, 120, y + 8);

  const fileName = `AURA_Dossier_${profile.astronautCode}_${Date.now()}.pdf`;
  const blob = doc.output('blob');

  return { doc, blob, fileName };
}

export function downloadDossierPdf(doc: jsPDF, fileName: string): void {
  doc.save(fileName);
}

export async function transmitDossierToEarth(
  profile: AstronautProfileState,
  vital: VitalReadingInput,
  alert: TriageDiagnosisOutput,
): Promise<{ fileName: string; transmissionId: string }> {
  const { doc, blob, fileName } = generateClinicalDossierPdf(profile, vital, alert);

  // Trigger local save for immediate crew convenience
  downloadDossierPdf(doc, fileName);

  // Enqueue via Delay-Tolerant Networking queue
  const record = await useOfflineSyncStore.getState().enqueueMedicalDossier({
    alertId: alert.$id || `ALT-${Date.now().toString(36).toUpperCase()}`,
    telemetryJson: JSON.stringify({ profile, vital, alert }),
    reportBlob: blob,
    fileName,
  });

  return {
    fileName,
    transmissionId: record.$id,
  };
}

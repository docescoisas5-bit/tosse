import { DiagnosisResult } from '../types';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import * as Print from 'expo-print';
import { Platform } from 'react-native';

/**
 * Serviço para gerar PDF com resultados da análise
 */
export class PDFService {
  /**
   * Gera HTML do relatório de análise
   */
  private generateHTML(diagnosis: DiagnosisResult, userEmail?: string): string {
    const date = new Date(diagnosis.timestamp).toLocaleString('pt-BR');
    const predictedClass = diagnosis.predictedClass || 'normal';
    const confidence = (diagnosis.confidence * 100).toFixed(1);
    
    const getClassLabel = (cls: string): string => {
      switch (cls) {
        case 'normal': return 'Normal';
        case 'bronchitis': return 'Bronquite';
        case 'pneumonia': return 'Pneumonia';
        default: return 'Indeterminado';
      }
    };

    const getRecommendation = (cls: string): string => {
      switch (cls) {
        case 'normal':
          return 'O som da tosse parece normal. Continue monitorando e consulte um médico se os sintomas persistirem.';
        case 'bronchitis':
          return 'Possíveis sinais de bronquite detectados. Recomenda-se consultar um médico para avaliação adequada.';
        case 'pneumonia':
          return 'Possíveis sinais de pneumonia detectados. É altamente recomendado consultar um médico imediatamente.';
        default:
          return 'Não foi possível determinar com precisão. Consulte um médico para avaliação.';
      }
    };

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      padding: 40px;
      background: #f5f5f5;
      color: #333;
    }
    .container {
      max-width: 800px;
      margin: 0 auto;
      background: white;
      padding: 40px;
      border-radius: 12px;
      box-shadow: 0 4px 6px rgba(0,0,0,0.1);
    }
    .header {
      text-align: center;
      margin-bottom: 40px;
      padding-bottom: 20px;
      border-bottom: 3px solid #667eea;
    }
    .header h1 {
      color: #667eea;
      font-size: 32px;
      margin-bottom: 10px;
    }
    .header p {
      color: #666;
      font-size: 14px;
    }
    .section {
      margin-bottom: 30px;
    }
    .section-title {
      font-size: 20px;
      font-weight: bold;
      color: #333;
      margin-bottom: 15px;
      padding-bottom: 10px;
      border-bottom: 2px solid #e0e0e0;
    }
    .result-box {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 30px;
      border-radius: 12px;
      text-align: center;
      margin-bottom: 30px;
    }
    .result-label {
      font-size: 14px;
      opacity: 0.9;
      margin-bottom: 10px;
    }
    .result-value {
      font-size: 48px;
      font-weight: bold;
      margin-bottom: 10px;
    }
    .confidence {
      font-size: 18px;
      opacity: 0.9;
    }
    .probabilities {
      display: flex;
      flex-direction: column;
      gap: 15px;
    }
    .probability-item {
      display: flex;
      align-items: center;
      gap: 15px;
    }
    .probability-label {
      width: 120px;
      font-weight: 600;
      font-size: 14px;
    }
    .probability-bar-container {
      flex: 1;
      height: 30px;
      background: #e0e0e0;
      border-radius: 15px;
      overflow: hidden;
      position: relative;
    }
    .probability-bar {
      height: 100%;
      border-radius: 15px;
      display: flex;
      align-items: center;
      justify-content: flex-end;
      padding-right: 10px;
      color: white;
      font-weight: bold;
      font-size: 12px;
      transition: width 0.3s ease;
    }
    .probability-value {
      width: 60px;
      text-align: right;
      font-weight: bold;
      font-size: 14px;
    }
    .recommendation {
      background: #E7F3FF;
      padding: 20px;
      border-radius: 8px;
      border-left: 4px solid #4A90E2;
      margin-bottom: 20px;
    }
    .recommendation-title {
      font-weight: bold;
      margin-bottom: 10px;
      color: #333;
    }
    .recommendation-text {
      color: #333;
      line-height: 1.6;
    }
    .methodology {
      background: #f8f9fa;
      padding: 20px;
      border-radius: 8px;
      margin-bottom: 20px;
    }
    .methodology-title {
      font-weight: bold;
      margin-bottom: 10px;
      color: #333;
    }
    .methodology-list {
      list-style: none;
      padding-left: 0;
    }
    .methodology-list li {
      padding: 8px 0;
      padding-left: 25px;
      position: relative;
      color: #666;
      line-height: 1.6;
    }
    .methodology-list li:before {
      content: "•";
      position: absolute;
      left: 0;
      color: #667eea;
      font-weight: bold;
      font-size: 20px;
    }
    .warning {
      background: #FFF9E6;
      padding: 20px;
      border-radius: 8px;
      border-left: 4px solid #FFC107;
      margin-top: 30px;
    }
    .warning-text {
      color: #856404;
      line-height: 1.6;
      font-size: 14px;
    }
    .footer {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px solid #e0e0e0;
      text-align: center;
      color: #666;
      font-size: 12px;
    }
    .info-row {
      display: flex;
      justify-content: space-between;
      margin-bottom: 10px;
      font-size: 14px;
    }
    .info-label {
      font-weight: 600;
      color: #666;
    }
    .info-value {
      color: #333;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>📊 Relatório de Análise de Tosse</h1>
      <p>Sistema de Análise Inteligente com IA</p>
    </div>

    <div class="section">
      <div class="info-row">
        <span class="info-label">Data da Análise:</span>
        <span class="info-value">${date}</span>
      </div>
      ${userEmail ? `
      <div class="info-row">
        <span class="info-label">Usuário:</span>
        <span class="info-value">${userEmail}</span>
      </div>
      ` : ''}
    </div>

    <div class="result-box">
      <div class="result-label">Resultado Previsto</div>
      <div class="result-value">${getClassLabel(predictedClass)}</div>
      <div class="confidence">${confidence}% de confiança</div>
    </div>

    <div class="section">
      <div class="section-title">📈 Probabilidades Detalhadas</div>
      <div class="probabilities">
        <div class="probability-item">
          <div class="probability-label">Normal</div>
          <div class="probability-bar-container">
            <div class="probability-bar" style="width: ${diagnosis.normal * 100}%; background: #28A745;">
              ${(diagnosis.normal * 100).toFixed(1)}%
            </div>
          </div>
          <div class="probability-value">${(diagnosis.normal * 100).toFixed(1)}%</div>
        </div>
        <div class="probability-item">
          <div class="probability-label">Bronquite</div>
          <div class="probability-bar-container">
            <div class="probability-bar" style="width: ${diagnosis.bronchitis * 100}%; background: #FFC107;">
              ${(diagnosis.bronchitis * 100).toFixed(1)}%
            </div>
          </div>
          <div class="probability-value">${(diagnosis.bronchitis * 100).toFixed(1)}%</div>
        </div>
        <div class="probability-item">
          <div class="probability-label">Pneumonia</div>
          <div class="probability-bar-container">
            <div class="probability-bar" style="width: ${diagnosis.pneumonia * 100}%; background: #DC3545;">
              ${(diagnosis.pneumonia * 100).toFixed(1)}%
            </div>
          </div>
          <div class="probability-value">${(diagnosis.pneumonia * 100).toFixed(1)}%</div>
        </div>
      </div>
    </div>

    <div class="recommendation">
      <div class="recommendation-title">💡 Recomendação</div>
      <div class="recommendation-text">${getRecommendation(predictedClass)}</div>
    </div>

    <div class="methodology">
      <div class="methodology-title">🔬 Metodologia Utilizada</div>
      <ul class="methodology-list">
        <li><strong>Gravação de Áudio:</strong> O áudio da tosse foi gravado em alta qualidade (16 kHz, 16-bit, mono)</li>
        <li><strong>Extração de Características:</strong> Utilizamos MFCC (Mel-Frequency Cepstral Coefficients) para extrair 13 características do áudio</li>
        <li><strong>Processamento:</strong> STFT (Short-Time Fourier Transform) seguido de espectrograma Mel e DCT (Discrete Cosine Transform)</li>
        <li><strong>Modelo de IA:</strong> Rede neural profunda treinada com TensorFlow/Keras, utilizando camadas Dense, BatchNormalization e Dropout</li>
        <li><strong>Classificação:</strong> O modelo utiliza softmax para gerar probabilidades para 3 classes: Normal, Bronquite e Pneumonia</li>
        <li><strong>Confiança:</strong> A confiança é calculada como a probabilidade máxima entre as três classes</li>
      </ul>
    </div>

    <div class="warning">
      <div class="warning-text">
        <strong>⚠️ Aviso Importante:</strong> Este resultado é apenas uma análise auxiliar baseada em inteligência artificial e não substitui o diagnóstico médico profissional. Sempre consulte um médico qualificado para avaliação adequada e tratamento.
      </div>
    </div>

    <div class="footer">
      <p>Relatório gerado automaticamente pelo Sistema de Análise de Tosse</p>
      <p>Este documento foi gerado em ${new Date().toLocaleString('pt-BR')}</p>
    </div>
  </div>
</body>
</html>
    `;
  }

  /**
   * Gera e salva PDF do relatório de análise
   */
  async generatePDF(diagnosis: DiagnosisResult, userEmail?: string): Promise<string> {
    try {
      const html = this.generateHTML(diagnosis, userEmail);
      
      // Salva HTML temporariamente
      const htmlPath = `${FileSystem.documentDirectory}relatorio_${Date.now()}.html`;
      await FileSystem.writeAsStringAsync(htmlPath, html, {
        encoding: 'utf8' as any,
      });

      // Para React Native, vamos usar expo-print ou react-native-html-to-pdf
      // Por enquanto, vamos retornar o HTML e sugerir usar expo-print
      console.log('📄 HTML gerado em:', htmlPath);
      
      // Gera PDF usando expo-print
      try {
        const { uri } = await Print.printToFileAsync({
          html,
          base64: false,
          width: 612, // A4 width em pontos
          height: 792, // A4 height em pontos
        });
        console.log('✅ PDF gerado em:', uri);
        return uri;
      } catch (printError) {
        console.error('Erro ao gerar PDF com expo-print:', printError);
        // Fallback: retorna o HTML para visualização
        console.warn('Retornando HTML como fallback');
        return htmlPath;
      }
    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
      throw error;
    }
  }

  /**
   * Compartilha o PDF gerado
   */
  async sharePDF(pdfUri: string): Promise<void> {
    try {
      const isAvailable = await Sharing.isAvailableAsync();
      if (!isAvailable) {
        throw new Error('Compartilhamento não disponível nesta plataforma');
      }

      await Sharing.shareAsync(pdfUri, {
        mimeType: 'application/pdf',
        dialogTitle: 'Compartilhar Relatório PDF',
      });
    } catch (error) {
      console.error('Erro ao compartilhar PDF:', error);
      throw error;
    }
  }
}

export const pdfService = new PDFService();


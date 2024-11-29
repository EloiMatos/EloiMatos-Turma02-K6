import { htmlReport } from 'https://raw.githubusercontent.com/benc-uk/k6-reporter/main/dist/bundle.js';
import { textSummary } from 'https://jslib.k6.io/k6-summary/0.0.1/index.js';
import http from 'k6/http';
import { check, sleep } from 'k6';
import { Trend, Rate } from 'k6/metrics';

// Definição das métricas
export const getRequestDuration = new Trend('get_request_duration', true); // Métrica para a duração da requisição
export const RateStatusOK = new Rate('status_200_OK'); // Métrica para taxa de sucesso de status 200

// Configurações do teste
export const options = {
  thresholds: {
    // Limites do threshold
    http_req_failed: ['rate<0.12'], // Menos de 12% de falhas nas requisições
    get_request_duration: ['p(95)<5700'], // 95% das requisições devem ter tempo abaixo de 5700ms
    status_200_OK: ['rate>0.88']
  },
  stages: [
    { duration: '15s', target: 10 },
    { duration: '60s', target: 50 },
    { duration: '15s', target: 100 },
    { duration: '60s', target: 100 },
    { duration: '15s', target: 150 },
    { duration: '60s', target: 150 },
    { duration: '15s', target: 300 },
    { duration: '60s', target: 300 }
  ]
};

// Função para gerar o relatório de resumo após o teste
export function handleSummary(data) {
  return {
    './src/output/index.html': htmlReport(data), // Relatório HTML
    stdout: textSummary(data, { indent: ' ', enableColors: true }) // Resumo no console
  };
}

export default function () {
  const baseUrl =
    'https://api.nasa.gov/planetary/apod?api_key=CUbezmxaFRhIXbbRI7Y5hHnNCqpP94ub8QuRTF71';

  // Realiza a requisição GET para a API da NASA
  const res = http.get(baseUrl);

  // Adiciona a duração da requisição à métrica de Trend
  getRequestDuration.add(res.timings.duration);

  // Adiciona a taxa de sucesso para o código 200
  RateStatusOK.add(res.status === 200);

  // Verifica se o status da resposta é 200 OK
  check(res, {
    'GET NASA APOD - Status 200': () => res.status === 200
  });
}

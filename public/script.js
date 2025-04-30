let userId = localStorage.getItem('userId');
if (!userId) {
  userId = crypto.randomUUID();
  localStorage.setItem('userId', userId);
}

const form = document.getElementById('scoreForm');
const scoreInput = document.getElementById('scoreInput');
const scoreList = document.getElementById('scoreList');
const scoreChartCtx = document.getElementById('scoreChart').getContext('2d');
let chart;

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const score = parseInt(scoreInput.value);

  if (isNaN(score) || score < 0 || score > 100) {
    alert('Inserisci un punteggio valido tra 0 e 100.');
    return;
  }

  try {
    await fetch('/submit-score', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ punteggio: score, idUtente: userId })
    });

    loadScores(); // Ricarica la graduatoria
    scoreInput.value = '';
  } catch (error) {
    console.error('Errore nell\'invio del punteggio:', error);
  }
});

async function loadScores() {
  try {
    const res = await fetch('/get-scores');
    const scores = await res.json();
    
    // Aggiorna lista graduatoria
    scoreList.innerHTML = '';
    scores.forEach((s, index) => {
      const li = document.createElement('li');
      li.textContent = `${index + 1}. ${s.punteggio} punti`;
      scoreList.appendChild(li);
    });

    // Aggiorna grafico
    updateChart(scores.map(s => s.punteggio));
  } catch (error) {
    console.error('Errore nel caricamento dei punteggi:', error);
  }
}

function updateChart(data) {
  const bins = new Array(11).fill(0);

  data.forEach(score => {
    const bin = Math.min(Math.floor(score / 10), 10);
    bins[bin]++;
  });

  const labels = ['0-9', '10-19', '20-29', '30-39', '40-49', '50-59', '60-69', '70-79', '80-89', '90-99', '100'];

  if (chart) chart.destroy();

  chart = new Chart(scoreChartCtx, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [{
        label: 'Numero di studenti',
        data: bins,
        backgroundColor: 'rgba(0, 123, 255, 0.7)'
      }]
    },
    options: {
      responsive: true,
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            precision: 0
          }
        }
      }
    }
  });
}

// Carica inizialmente
loadScores();


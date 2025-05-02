// Attendi che il DOM sia completamente caricato
document.addEventListener('DOMContentLoaded', function() {
  // Genera un ID numerico invece di UUID
  let userId = localStorage.getItem('userId');
  if (!userId) {
    // Genera un ID numerico casuale tra 1 e 1000000
    userId = Math.floor(Math.random() * 1000000) + 1;
    localStorage.setItem('userId', userId);
  } else {
    // Assicurati che l'userId sia un numero
    userId = parseInt(userId, 10);
    if (isNaN(userId)) {
      userId = Math.floor(Math.random() * 1000000) + 1;
      localStorage.setItem('userId', userId);
    }
  }

  const form = document.getElementById('scoreForm');
  const scoreInput = document.getElementById('scoreInput');
  const scoreList = document.getElementById('scoreList');
  const cancelBtn = document.getElementById('cancelBtn');
  let chart;
  let userHasSubmittedScore = false;
  
  // Ottieni il canvas in modo sicuro
  const distChartCanvas = document.getElementById('distChart');
  let scoreChartCtx = null;
  
  // Verifica che il canvas esista prima di ottenere il contesto
  if (distChartCanvas) {
    scoreChartCtx = distChartCanvas.getContext('2d');
    console.log('Canvas trovato e contesto 2D ottenuto');
  } else {
    console.error('Canvas #distChart non trovato nel DOM!');
  }

  // Event listener per il form
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const score = parseFloat(scoreInput.value);

    if (isNaN(score) || score < 0 || score > 100) {
      alert('Inserisci un punteggio valido tra 0 e 100.');
      return;
    }

    try {
      const response = await fetch('/submit-score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          userId: Number(userId), 
          punteggio: Number(score) 
        })
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Errore HTTP ${response.status}: ${errorText}`);
      }
      
      const result = await response.json();
      
      scoreInput.value = '';
      userHasSubmittedScore = true;
      cancelBtn.classList.remove('hidden');
      loadScores();
    } catch (error) {
      console.error('Errore durante l\'invio del punteggio:', error);
      alert(`Errore: ${error.message}`);
    }
  });

  // Funzione per caricare i punteggi
  async function loadScores() {
    try {
      const res = await fetch('/get-scores');
      
      if (!res.ok) {
        throw new Error(`Errore HTTP ${res.status}`);
      }
      
      const scores = await res.json();

      // Controlla se l'utente ha un punteggio
      userHasSubmittedScore = scores.some(entry => Number(entry.userId) === Number(userId));
      
      // Mostra/nascondi il pulsante annulla
      cancelBtn.classList.toggle('hidden', !userHasSubmittedScore);

      // Aggiorna la lista
      scoreList.innerHTML = '';
      scores.forEach((entry, index) => {
        const li = document.createElement('li');
        
        // Verifica se questo è il punteggio dell'utente
        const isUserScore = Number(entry.userId) === Number(userId);
        
        // Formatta il punteggio con al massimo una cifra decimale
        const formattedScore = Number(entry.score) % 1 === 0 
          ? Number(entry.score).toFixed(0) 
          : Number(entry.score).toFixed(1);
        
        // Aggiungi un indicatore se questo è il punteggio dell'utente
        if (isUserScore) {
          li.textContent = `${index + 1}. ${formattedScore} punti (il tuo punteggio)`;
          li.style.fontWeight = 'bold';
        } else {
          li.textContent = `${index + 1}. ${formattedScore} punti`;
        }
        
        scoreList.appendChild(li);
      });

      // Aggiorna il grafico solo se il contesto è disponibile
      if (scoreChartCtx) {
        createDistributionChart(scores);
      } else {
        console.error('Impossibile creare il grafico: contesto del canvas non disponibile');
        
        // Riprova a ottenere il contesto del canvas (potrebbe essere stato caricato dopo)
        const canvas = document.getElementById('distChart');
        if (canvas) {
          scoreChartCtx = canvas.getContext('2d');
          if (scoreChartCtx) {
            console.log('Canvas recuperato al secondo tentativo');
            createDistributionChart(scores);
          }
        }
      }
    } catch (error) {
      console.error('Errore nel caricamento dei punteggi:', error);
    }
  }

  // Funzione per creare il grafico di distribuzione di probabilità
  function createDistributionChart(scores) {
    // Se il grafico esiste già, distruggilo
    if (chart) {
      chart.destroy();
    }
    
    // Se non ci sono punteggi
    if (!scores || scores.length === 0) {
      chart = new Chart(scoreChartCtx, {
        type: 'bar',
        data: {
          labels: ['0-10', '11-20', '21-30', '31-40', '41-50', '51-60', '61-70', '71-80', '81-90', '91-100'],
          datasets: [{
            label: 'Nessun dato disponibile',
            data: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            backgroundColor: 'rgba(200, 200, 200, 0.5)'
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
      return;
    }
    
    // Calcola i punteggi in ordine crescente
    const sortedScores = scores.map(entry => parseFloat(entry.score)).sort((a, b) => a - b);
    
    // Prepara i dati per il grafico
    const dataPoints = [];
    
    // Aggiungi sempre il punto iniziale (0,0)
    dataPoints.push({x: 0, y: 0});
    
    // Calcola i percentili
    sortedScores.forEach((score, index) => {
      const percentile = ((index + 1) / sortedScores.length) * 100;
      dataPoints.push({
        x: score,
        y: percentile
      });
    });
    
    // Se l'ultimo punto non è 100, aggiungi un punto finale a (100,100)
    if (dataPoints.length > 0 && dataPoints[dataPoints.length - 1].x < 100) {
      dataPoints.push({x: 100, y: 100});
    }
    
    // Trova il punteggio dell'utente
    const userScoreObj = scores.find(entry => Number(entry.userId) === Number(userId));
    let userPoint = null;
    
    if (userScoreObj) {
      const userScore = parseFloat(userScoreObj.score);
      // Calcola il percentile dell'utente contando quanti punteggi sono minori o uguali
      const userPercentile = (sortedScores.filter(score => score <= userScore).length / sortedScores.length) * 100;
      userPoint = {
        x: userScore,
        y: userPercentile
      };
    }
    
    // Configura il grafico
    const datasets = [{
      label: 'Percentile',
      data: dataPoints,
      borderColor: 'rgba(0, 123, 255, 0.7)',
      backgroundColor: 'rgba(0, 123, 255, 0.1)',
      fill: true,
      tension: 0.4,
      pointRadius: 0
    }];
    
    // Aggiungi il punto dell'utente se presente
    if (userPoint) {
      datasets.push({
        label: 'Il tuo punteggio',
        data: [userPoint],
        borderColor: 'red',
        backgroundColor: 'red',
        pointRadius: 6,
        pointHoverRadius: 8
      });
    }
    
    // Crea il grafico
    chart = new Chart(scoreChartCtx, {
      type: 'line',
      data: {
        datasets: datasets
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: {
            type: 'linear',
            min: 0,
            max: 100,
            title: {
              display: true,
              text: 'Punteggio'
            },
            ticks: {
              callback: function(value) {
                return value + "";
              }
            }
          },
          y: {
            min: 0,
            max: 100,
            title: {
              display: true,
              text: 'Percentile (%)'
            },
            ticks: {
              callback: function(value) {
                return value + "%";
              }
            }
          }
        },
        plugins: {
          tooltip: {
            callbacks: {
              label: function(context) {
                if (context.dataset.label === 'Il tuo punteggio') {
                  return `Il tuo punteggio: ${context.raw.x.toFixed(1)}, Percentile: ${context.raw.y.toFixed(1)}%`;
                }
                return `Punteggio: ${context.raw.x.toFixed(1)}, Percentile: ${context.parsed.y.toFixed(1)}%`;
              }
            }
          }
        }
      }
    });
  }

  // Funzione per eliminare un punteggio
  async function deleteScore() {
    if (confirm('Sei sicuro di voler eliminare il tuo punteggio?')) {
      try {
        const response = await fetch('/delete-score', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: Number(userId) })
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Errore HTTP ${response.status}: ${errorText}`);
        }
        
        const result = await response.json();
        
        alert('Punteggio eliminato con successo!');
        userHasSubmittedScore = false;
        cancelBtn.classList.add('hidden');
        loadScores();
      } catch (error) {
        console.error('Errore durante l\'eliminazione del punteggio:', error);
        alert(`Errore: ${error.message}`);
      }
    }
  }

  // Event listener per il pulsante di cancellazione
  cancelBtn.addEventListener('click', deleteScore);

  // Caricamento iniziale
  loadScores();
});

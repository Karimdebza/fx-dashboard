import { Component, OnInit, ViewChild, ElementRef, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FxService } from '../../services/fx.service';
import { FxResponse } from '../../interfaces/FxResponse';
import { Chart, registerables } from 'chart.js';
import { BacktestResult } from '../../interfaces/Backtest';
import { CompareResponse } from '../../interfaces/CompareResponse';
Chart.register(...registerables);
@Component({
  selector: 'app-dashboard',
  imports: [CommonModule,FormsModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
})
export class Dashboard implements OnInit, OnDestroy {

@ViewChild('chart') fxChartRef!: ElementRef;

  selectedPeriod:number = 60;
  periods = [{label:'1M', value:30},{label:'3M', value:90},{label:'6M', value:180},{label:'1AN', value:365}];  
  devises = ['MAD','USD', 'GBP', 'JPY']
  selectedDevise = 'MAD';
  days = 5;
  loading = false;
  error :string | null = null;
  backtest: BacktestResult | null = null;
  backtestLoading = false;
  currentRate:number | null = null;
  trend:string | null = null;
  trendUp:boolean = false ;  
  lastPrediction:number | null = null;
  predictions:{date:string,prediction:number;lower:number;upper:number}[] = [];
  alertMessage:string | null = null;
  alertUp:boolean = true;
  compareMode = false;
  compareLoading = false;
  private chart: Chart | null = null;
  private readonly DEVISE_COLORS: Record<string, string> = {
    MAD: '#6366f1', // indigo
    USD: '#f59e0b', // amber
    GBP: '#10b981', // green
    JPY: '#ef4444', // red
  };
  amount: number = 1000;
  private lastData: FxResponse | null = null;
  constructor(private fxService: FxService) {}

  ngOnInit(): void {
    this.loadData();
    this.loadBacktest();
  }

  ngOnDestroy(): void {
    this.chart?.destroy();
  }
toggleCompareMode() {
  this.compareMode = !this.compareMode;
  if (this.compareMode) {
    this.loadCompare();
  } else {
    setTimeout(() => {
      if (this.lastData) this.buildChart(this.lastData);
    }, 300); // ← 300ms au lieu de 100ms
  }
}
loadCompare() {
  this.compareLoading = true;
  this.fxService.compare(this.days).subscribe({
    next: (data) => {
      this.compareLoading = false;
      setTimeout(() => this.buildCompareChart(data), 200);
    },
    error: () => {
      this.compareLoading = false;
      this.error = 'Erreur de chargement de la comparaison.';
    }
  });
}
 
buildCompareChart(data: CompareResponse) {
  if (!this.fxChartRef?.nativeElement) return;
  this.chart?.destroy();

  const devises = Object.keys(data).filter(d => !data[d].error);
  if (!devises.length) return;

  const ref = data[devises[0]];
  const labels = [...ref.dates.slice(-this.selectedPeriod), ...ref.pred_dates];

  const datasets: any[] = [];

  devises.forEach(devise => {
    const d = data[devise];
    const color = this.DEVISE_COLORS[devise] ?? '#94a3b8';
    const historicSlice = d.historic.slice(-this.selectedPeriod);

    // Valeur de référence = premier point historique
    const base = historicSlice[0];

    // Normalisation en % : (valeur - base) / base * 100
    const normalize = (v: number | null) =>
      v === null ? null : parseFloat(((v - base) / base * 100).toFixed(3));

    datasets.push({
      label: `${devise}`,
      data: [
        ...historicSlice.map(normalize),
        ...new Array(d.pred_dates.length).fill(null)
      ],
      borderColor: color,
      borderWidth: 2,
      pointRadius: 0,
      tension: 0.3,
    });

    datasets.push({
      label: `${devise} préd.`,
      data: [
        ...new Array(historicSlice.length).fill(null),
        ...d.predictions.map(normalize)
      ],
      borderColor: color,
      borderDash: [5, 5],
      borderWidth: 2,
      pointRadius: 0,
      tension: 0.3,
    });
  });

  this.chart = new Chart(this.fxChartRef.nativeElement, {
    type: 'line',
    data: { labels, datasets },
    options: {
      responsive: true,
      interaction: { mode: 'index', intersect: false },
      plugins: {
        legend: {
          labels: {
            color: '#94a3b8',
            filter: (item) => !item.text.includes('préd.')
          }
        },
        tooltip: {
          callbacks: {
            label: (ctx) => {
              if (ctx.parsed.y === null) return '';
              const sign = ctx.parsed.y >= 0 ? '+' : '';
              return `${ctx.dataset.label}: ${sign}${ctx.parsed.y.toFixed(3)}%`;
            }
          }
        }
      },
      scales: {
        x: {
          ticks: { color: '#94a3b8', maxTicksLimit: 8 },
          grid: { color: '#1e293b' }
        },
        y: {
          ticks: {
            color: '#94a3b8',
            callback: (v) => `${v}%`  // affiche % sur l'axe Y
          },
          grid: { color: '#334155' }
        }
      }
    }
  });
}
  selectDevise(devise: string) {
    this.selectedDevise = devise;
    this.loadData();
    this.loadBacktest();
  }

  selectPeriod(days: number) {
    this.selectedPeriod = days;
    if(this.lastData) this.buildChart(this.lastData);
  }
  onDaysChange() {
    this.loadData();
  }
  
  loadData() {
    this.loading = true;
    this.error = null;

    this.fxService.predict(this.selectedDevise, this.days).subscribe({
      next:(data)=>{
       
      
        this.loading = false;
        this.processdata(data);
       setTimeout(() => {
    
    this.buildChart(data);
  }, 200);

      
      
      },
      error:(err)=>{

        this.error = 'ERREUR de chargement des données.';
        this.loading = false;
      
      }
    });
  }

  processdata(data:FxResponse) {
    this.lastData = data;
    this.currentRate = data.historic.at(-1) ?? null;
    this.lastPrediction = data.predictions.at(-1) ?? null;
    this.trendUp = (data.predictions[0] ?? 0) > (this.currentRate ?? 0);
    this.trend = this.trendUp ? '↑' : '↓';
    this.predictions = data.pred_dates.map((date, i) => ({
      date,
      prediction: parseFloat(data.predictions[i].toFixed(4)),
      lower: parseFloat(data.lower[i].toFixed(4)),
      upper: parseFloat(data.upper[i].toFixed(4))
    }));
    if(this.lastPrediction && this.currentRate) {
      const variation = ((this.lastPrediction - this.currentRate) / this.currentRate) * 100;
      if(Math.abs(variation) >= 0.5) {
          this.alertUp = variation > 0;
          this.alertMessage = `Tendance forte détectée : ${variation > 0 ? '+' : ''}${variation.toFixed(2)}% sur ${this.days} jours`;
      }else {
        this.alertMessage = null;
      }
    }
  }


  loadBacktest() {
    this.backtestLoading = true;
    this.fxService.backtest(this.selectedDevise).subscribe({
      next: (data) => {
        this.backtest = data;
        this.backtestLoading = false;
      },
      error: () => this.backtestLoading = false
    });
  }
  

  buildChart(data: FxResponse) {
     if (!this.fxChartRef?.nativeElement) return;
     this.fxChartRef.nativeElement.style.display = 'block';
      this.loading = false;
      const last60dates = data.dates.slice(-this.selectedPeriod);
      const last60values = data.historic.slice(-this.selectedPeriod);
      const labels = [...last60dates, ...data.pred_dates];
        const historicData = [
        ...last60values.map(v => parseFloat(v.toFixed(4))),
        ...new Array(data.pred_dates.length).fill(null)
      ];
     const predData = [
      ...new Array(last60dates.length).fill(null),
      ...data.predictions.map(v => parseFloat(v.toFixed(4)))
    ];

    const upperData = [
      ...new Array(last60dates.length).fill(null),
      ...data.upper.map(v => parseFloat(v.toFixed(4)))
    ];

    const lowerData = [
      ...new Array(last60dates.length).fill(null),
      ...data.lower.map(v => parseFloat(v.toFixed(4)))
    ];

    this.chart?.destroy();

    this.chart = new Chart(this.fxChartRef.nativeElement, {
      type: 'line',
      data: {
        labels,
        datasets: [
          {
            label: 'Historique',
            data: historicData,
            borderColor: '#6366f1',
            borderWidth: 2,
            pointRadius: 0,
            tension: 0.3,
          },
          {
            label: 'Prédiction',
            data: predData,
            borderColor: '#f59e0b',
            borderDash: [5, 5],
            borderWidth: 2,
            pointRadius: 0,
            tension: 0.3,
          },
          {
            label: 'Max',
            data: upperData,
            borderColor: 'transparent',
            backgroundColor: 'rgba(245,158,11,0.15)',
            fill: '+1',
            pointRadius: 0,
          },
          {
            label: 'Min',
            data: lowerData,
            borderColor: 'transparent',
            backgroundColor: 'rgba(245,158,11,0.15)',
            fill: false,
            pointRadius: 0,
          },
        ]
      },
      options: {
        responsive: true,
        plugins: { legend: { labels: { color: '#94a3b8' } } },
        scales: {
          x: { ticks: { color: '#94a3b8', maxTicksLimit: 8 }, grid: { color: '#1e293b' } },
          y: { ticks: { color: '#94a3b8' }, grid: { color: '#334155' } }
        }
      }
    });
  }

  convert():string {
    if(!this.currentRate || !this.amount) return '—';
    return (this.amount * this.currentRate).toFixed(2);
  }

}
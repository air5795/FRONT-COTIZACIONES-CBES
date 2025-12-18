import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { forkJoin } from 'rxjs';
import { DashboardAdminService, AdminDashboardSummary, UltimaPlanilla, UltimaReembolso } from '../../servicios/dashboard/dashboard-admin.service';
import { SessionService } from '../../servicios/auth/session.service';

interface DashboardCard {
  label: string;
  key: keyof AdminDashboardSummary;
  icon: string;
  color: string;
  bg: string;
}

@Component({
  selector: 'app-panel-admin',
  templateUrl: './panel-admin.component.html',
  styleUrls: ['./panel-admin.component.css'],
})
export class PanelAdminComponent implements OnInit {
  resumen: AdminDashboardSummary = {
    planillasDeclaradas: 0,
    planillasPendientesRevision: 0,
    reembolsosSolicitados: 0,
    reembolsosPendientesRevision: 0,
  };

  ultimasPlanillas: UltimaPlanilla[] = [];
  ultimasReembolsos: UltimaReembolso[] = [];
  ultimasReembolsosFiltradas: UltimaReembolso[] = [];
  chartPlanillasData: any;
  chartPlanillasOptions: any;
  chartReembolsosData: any;
  chartReembolsosOptions: any;
  cargando = false;
  userName = 'Usuario';

  cards: DashboardCard[] = [
    { label: 'Planillas declaradas', key: 'planillasDeclaradas', icon: 'pi pi-check-circle', color: '#0f9f89', bg: 'rgba(15,159,137,0.12)' },
    { label: 'Planillas pendientes revisión', key: 'planillasPendientesRevision', icon: 'pi pi-hourglass', color: '#2abf75', bg: 'rgba(42,191,117,0.12)' },
    { label: 'Reembolsos solicitados', key: 'reembolsosSolicitados', icon: 'pi pi-wallet', color: '#34c5bb', bg: 'rgba(52,197,187,0.12)' },
    { label: 'Reembolsos pendientes', key: 'reembolsosPendientesRevision', icon: 'pi pi-exclamation-circle', color: '#4fa85a', bg: 'rgba(79,168,90,0.12)' },
  ];

  constructor(
    private dashboardService: DashboardAdminService,
    private router: Router,
    private sessionService: SessionService,
  ) {}

  ngOnInit(): void {
    this.setUserName();
    this.cargarDatos();
  }

  private setUserName() {
    const session = this.sessionService.sessionDataSubject.value;
    this.userName =
      session?.persona?.nombreCompleto ||
      [session?.persona?.nombres, session?.persona?.primerApellido, session?.persona?.segundoApellido].filter(Boolean).join(' ').trim() ||
      session?.rol?.rol ||
      'Usuario';
  }

  cargarDatos(): void {
    this.cargando = true;
    forkJoin({
      resumen: this.dashboardService.obtenerResumen(),
      ultimas: this.dashboardService.obtenerUltimasPlanillas(6),
      ultimasReembolsos: this.dashboardService.obtenerUltimasReembolsos(6),
    }).subscribe({
      next: ({ resumen, ultimas, ultimasReembolsos }) => {
        this.resumen = resumen;
        this.ultimasPlanillas = ultimas;
        this.ultimasReembolsos = ultimasReembolsos;
        this.ultimasReembolsosFiltradas = ultimasReembolsos.filter(r => r.estado !== 0);
        this.configurarGraficoPlanillas(ultimas);
        this.configurarGraficoReembolsos(ultimasReembolsos);
        this.cargando = false;
      },
      error: () => {
        this.cargando = false;
      },
    });
  }

  private configurarGraficoPlanillas(ultimas: UltimaPlanilla[]) {
    const labels = ultimas.map((item, idx) => `${idx + 1}. ${item.empresa || item.codPatronal}`);
    const montos = ultimas.map((item) => item.totalImporte || 0);
    const tipos = ultimas.map((item) => item.tipoPlanilla || 'Tipo no definido');
    const palette = ['#0f9f89', '#2abf75', '#34c5bb', '#4fa85a', '#21c0a2', '#1fbf75'];
    const background = labels.map((_, i) => palette[i % palette.length]);

    this.chartPlanillasData = {
      labels,
      datasets: [
        {
          label: 'Monto declarado',
          data: montos,
          backgroundColor: background,
          borderColor: '#f6f8fb',
          borderWidth: 2,
          borderRadius: 12,
          barThickness: 26,
          maxBarThickness: 30,
          categoryPercentage: 0.8,
          barPercentage: 0.9,
          tipos,
        },
      ],
    };

    this.chartPlanillasOptions = {
      indexAxis: 'y',
      responsive: true,
      maintainAspectRatio: false,
      layout: { padding: { top: 1, bottom: 1 } },
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: (context: any) => {
              const tipos: string[] = context.dataset?.tipos || [];
              const tipo = tipos[context.dataIndex] || 'Tipo no definido';
              const monto = context.parsed?.x ?? 0;
              return ` ${tipo} - Bs ${monto.toLocaleString()}`;
            },
          },
        },
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: {
            callback: (value: number) => `Bs ${value.toLocaleString()}`,
          },
        },
        y: {
          grid: { display: false },
          ticks: {
            autoSkip: false,
            font: { size: 12 },
          },
        },
      },
    };
  }

  private configurarGraficoReembolsos(ultimas: UltimaReembolso[]) {
    const labels = ultimas.map((item) => item.empresa || item.codPatronal);
    const montos = ultimas.map((item) => item.totalReembolso || 0);
    const palette = ['#0f9f89', '#2abf75', '#34c5bb', '#4fa85a', '#21c0a2', '#1fbf75'];
    const background = labels.map((_, i) => palette[i % palette.length]);

    this.chartReembolsosData = {
      labels,
      datasets: [
        {
          label: 'Monto solicitado',
          data: montos,
          backgroundColor: background,
          borderColor: '#f6f8fb',
          borderWidth: 2,
          borderRadius: 12,
          barThickness: 22,
          maxBarThickness: 26,
          categoryPercentage: 0.75,
          barPercentage: 0.85,
        },
      ],
    };

    this.chartReembolsosOptions = {
      indexAxis: 'y',
      responsive: true,
      maintainAspectRatio: false,
      layout: { padding: { top: 10, bottom: 10 } },
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: (context: any) => {
              const monto = context.parsed?.x ?? 0;
              return ` Bs ${monto.toLocaleString()}`;
            },
          },
        },
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: {
            callback: (value: number) => `Bs ${value.toLocaleString()}`,
          },
        },
        y: {
          grid: { display: false },
          ticks: {
            autoSkip: false,
            font: { size: 12 },
          },
        },
      },
    };
  }

  verPlanilla(planilla: UltimaPlanilla) {
    this.router.navigate(['/cotizaciones/planillas-aportes', planilla.id]);
  }

  verReembolso(sol: UltimaReembolso) {
    this.router.navigate(['/cotizaciones/historial-reembolsos/detalle', sol.id]);
  }

  navigateTo(route: string) {
    this.router.navigate([route]);
  }
}


import { Component, OnInit } from '@angular/core';
import { AppVersionInfo, HealthIndicatorKey, HealthIndicatorStatus } from './api';

const updateIntervalMs = 60000;

@Component({
  selector: 'my-app',
  templateUrl: './app.component.html',
  styleUrls: [ './app.component.scss' ]
})
export class AppComponent implements OnInit, OnDestroy {
  serverStatuses: Array<{
    server: BadgrProServerInfo;
    status?: HealthApiPublicResponse;
    checkTime?: Date;
  }> = [];

  nextUpdateMs: number = Date.now();

  nextUpdatePercent = 100;

  destroyActions: Array<() => unknown> = [];
  destroyed = false;
  ngOnDestroy() {
    this.destroyActions.forEach(it => it());
    this.destroyed = true;
  }

  ngOnInit() {
    this.serverStatuses = badgrProServerInfos.map(server => ({ server }));
    this.update();

    // Let angular update the bar
    const interval = setInterval(
      () => this.nextUpdatePercent = (this.nextUpdateMs - Date.now()) / updateIntervalMs * 100,1000 / 60
    );
    this.destroyActions.push(() => clearInterval(interval));
  }

  update() {
    for (let pair of this.serverStatuses) {
      pair.checkTime = new Date();
      fetch(pair.server.url + "/api/health/publicDetail")
          .then(it => it.json())
          .then(it => {
            pair.status = it as HealthApiPublicResponse;
            pair.status.pairs.sort((a, b) => compare(a.second.label, b.second.label))
          })
          .catch(e => null)
          ;
    }

    if (! this.destroyed) {
      this.nextUpdateMs = Date.now() + updateIntervalMs;
      setTimeout(() => this.update(), updateIntervalMs);
    }
  }
}

interface BadgrProServerInfo {
  name: string;
  url: string;
}

interface HealthApiPublicResponse {
  healthy: boolean;
  version: AppVersionInfo;
  pairs: Array<{
    first: HealthIndicatorKey,
    second: HealthIndicatorStatus
  }>;
}

const badgrProServerInfos: BadgrProServerInfo[] = [
  { name: "Prod: US", url: "https://badgr.com" },
  { name: "Prod: EU", url: "https://eu.badgr.com" },
  { name: "Prod: AU", url: "https://au.badgr.com" },
  { name: "Prod: CA", url: "https://ca.badgr.com" },
  { name: "Demo", url: "https://demo.badgr.com" },
  { name: "Test", url: "https://test.badgr.com" },
  { name: "Staging", url: "https://staging.badgr.dev" },
  { name: "Review", url: "https://review.badgr.dev" },
  //{ name: "Local", url: "http://localhost:8080" },
];

function compare(a: any, b: any) {
  return a === b ? 0 : a < b ? -1 : 1;
}
import { Injectable } from '@angular/core';

import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Posts } from '../pages/report-generation/report-generation.page';
import { Aposts } from '../report-generation-asset/report-generation-asset.page';

@Injectable({
	providedIn: 'root'
})
export class CreateReportEmpidService {
	constructor(private http: HttpClient) {}

	post(opost: Posts): Observable<any> {
		return this.http.post('https://martisapiversion1.herokuapp.com/report/getReports', opost);
	}

	getEmps(): Observable<any> {
		return this.http.get('https://martisapiversion1.herokuapp.com/user/getEmps');
	}

	getAssets(): Observable<any> {
		return this.http.get('https://martisapiversion1.herokuapp.com/asset/getAssets');
	}

	getAssetReport(opost: Aposts): Observable<any> {
		return this.http.post('https://martisapiversion1.herokuapp.com/report/getAssetReports', opost);
	}
}

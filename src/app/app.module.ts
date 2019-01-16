import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { RouteReuseStrategy } from '@angular/router';

import { IonicModule, IonicRouteStrategy } from '@ionic/angular';
import { SplashScreen } from '@ionic-native/splash-screen/ngx';
import { StatusBar } from '@ionic-native/status-bar/ngx';

import { HttpHandler } from '@angular/common/http'
import { HttpModule } from '@angular/http'
import { HttpClientModule } from '@angular/common/http';
import { HttpClient } from '@angular/common/http';
import { ApolloModule, Apollo } from 'apollo-angular';
import { HttpLinkModule, HttpLink } from 'apollo-angular-link-http';
import { InMemoryCache } from 'apollo-cache-inmemory';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { ListComponent } from './list/list.component';

@NgModule({
	declarations: [AppComponent, ListComponent],
	entryComponents: [],
	imports: [
		BrowserModule,
    HttpClientModule,
		IonicModule.forRoot(),
		AppRoutingModule
	],
	providers: [
    HttpLink,
		StatusBar,
		Apollo,
		SplashScreen,
		{ provide: RouteReuseStrategy, useClass: IonicRouteStrategy }
	],
	bootstrap: [AppComponent]
})
export class AppModule {
	constructor(
		apollo: Apollo,
		httpLink: HttpLink
	) {
		apollo.create({
      link: httpLink.create({uri: 'https://vm8mjvrnv3.lp.gql.zone/graphql'}),
			cache: new InMemoryCache()
		});
	}
}

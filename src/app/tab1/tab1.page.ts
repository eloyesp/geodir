import { Component, ViewChild, ElementRef } from '@angular/core';
import { Platform } from '@ionic/angular';
import { Router, ActivationEnd } from '@angular/router';
import { PopoverController } from '@ionic/angular';
import { HttpClient } from '@angular/common/http';
import { Observable, Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';
import leaflet from 'leaflet';
import 'leaflet';
import 'leaflet.markercluster';

import { ModalService } from '../providers/modal/modal.service';
import { DataService } from '../providers/data.service';
import { LinksService } from '../providers/links/links.service';

declare var jQuery: any;


var text_truncate = function (str, length, ending) {
  if (length == null) {
    length = 100;
  }
  if (ending == null) {
    ending = '...';
  }
  if (str.length > length) {
    return str.substring(0, length - ending.length) + ending;
  } else {
    return str;
  }
};

@Component({
  selector: 'app-tab1',
  templateUrl: 'tab1.page.html',
  styleUrls: ['tab1.page.scss']
})
export class Tab1Page {
  @ViewChild('map') mapContainer: ElementRef;
  markers: {};
  map: any;
  iconUfcSpot: any
  iconYellow: any
  iconSelf: any
  myMarker: any;
  locations: any;
  selflayer: any;
  layers: any;
  lat: any;
  items$: any;
  coords: Observable<any>;
  location: Observable<any>;
  private _routerSub = Subscription.EMPTY;
  marker: any = [];

  constructor(public http: HttpClient,
    private popoverController: PopoverController,
    public modal : ModalService,
    public platform: Platform,
    public dataService: DataService,
    private router: Router,
    public links: LinksService,
  ) {
    this.iconUfcSpot = leaflet.icon({
      iconUrl: '/assets/imgs/ufcspot.png',
      //shadowUrl: '/assets/imgs/ufcspot-shadow.png',
      iconSize: [38, 58],
      iconAnchor: [16, 58],
      popupAnchor: [2, -58],
    });

    this.iconYellow = leaflet.icon({
      iconUrl: '/assets/imgs/yellow.png',
      iconSize: [32, 32],
      iconAnchor: [16, 32],
    });

    this.iconSelf = leaflet.icon({
      iconUrl: '/assets/imgs/me.png',
      //shadowUrl: '/assets/imgs/me-shadow.png',
      iconSize: [38, 58],
      iconAnchor: [16, 58],
    });

    this._routerSub = this.router.events
      .pipe(
        filter((event: ActivationEnd) => event instanceof ActivationEnd)
      )
      .subscribe(event => {
        this.coords = event.snapshot.queryParams.coords;
        this.location = event.snapshot.queryParams.location;
      });
  }

  ngOnInit() {
    this.map = leaflet.map("map");
    this.loadmap();
  }

  ngOnDestroy() {
    this._routerSub.unsubscribe();
  }

  ionViewDidEnter() {
    this.map.invalidateSize();
    this.dataService.items$.subscribe(res => {
      if (this.location) this.centerOnMarker(this.location);
    });
  }

  ionViewDidLeave() {
    console.log("did leave");
  }

  loadmap() {
    console.log("loadmap called");
    leaflet.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attributions: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="http://mapbox.com">Mapbox</a>',
      maxZoom: 18
    }).addTo(this.map);

    this.addMyMarker();
    this.locations = leaflet.markerClusterGroup();

    this.dataService.items$.subscribe(res => {
      this.updateMarkers(res);
    });

  }

  updateMarkers(items) {
    var marker = {};
    var description = "";
    items.forEach(item => {
      var lat = item.geometry.coordinates[1];
      var lon = item.geometry.coordinates[0];
      var img = '';
      var icon = leaflet.divIcon({
        className: 'markerInvisible',
        popupAnchor: [10, 0], // point from which the popup should open relative to the iconAnchor
        //html: `<img style='width:30px;height:30px;border: 2px solid `+item.properties.icon_marker_color+`;
        //box-shadow: 0 0 5px 4px ` + hexToRGBA(item.properties.icon_marker_color, 0.2) + `
        //  ;' class='marker' src='statics/img/categories/` + item.properties.icon_name + `_black.svg' />`
        // html: "<img style='width:30px;height:30px;border: 2px solid " + hexToRGBA(item.properties.icon_marker_color, 0.2) + ";' class='marker marker-" + item.properties.icon_marker_color + "' src='statics/img/categories/" + item.properties.icon_name + "_black.svg' />"
      });
      this.marker[item.properties.id] = leaflet.marker([lat, lon], { icon: this.iconUfcSpot });

      if (item.properties.description != null) {
        description = `<div>` + text_truncate(item.properties.description, 200, "...") + `</div>`;
      }

      // Create an element to hold all your text and markup
      var container = jQuery('<div />');

      // Delegate all event handling for the container itself and its contents to the container
      container.on('click', '.more-info-button', () => {
        this.modal.openModal(item);
      });

      // Insert whatever you want into the container, using whichever approach you prefer
      container.html(`<div><b>` + item.properties.name + `</b><br/>` + item.properties.address + `<p>` +  description + `</p></div>`);
      container.append(`<ion-button class="more-info-button" expand="full">+info</ion-button>`);

      // Insert the container into the popup
      this.marker[item.properties.id].bindPopup(container[0]);

      this.marker[item.properties.id].on('mouseover', function (e) {
        //this.openPopup();
      });
      this.marker[item.properties.id].on('mouseout', function (e) {
        //this.closePopup();
      });
      this.marker[item.properties.id].on('click', function (e) {
        // show popup?
        this.openPopup();
      });
      this.marker[item.properties.id].addTo(this.locations);
    });
    this.map.addLayer(this.locations);
  }

  addMyMarker() {
    this.map.locate({
      watch: true,
      setView: false,
      maxZoom: 18
    }).on('locationfound', (e) => {
      this.dataService.sortNearBy(e.latitude, e.longitude);
      this.selflayer = leaflet.featureGroup();
      this.map.addLayer(this.selflayer);

      if (this.myMarker) {
        // Update marker position
        this.myMarker.setLatLng([e.latitude, e.longitude]);
        this.myMarker.setIcon(this.iconSelf);
      } else {
        // Not looking at a specific location, center on user
        if(!this.location) this.map.setView([e.latitude, e.longitude], 5);
        // Create marker
        this.myMarker = leaflet.marker([e.latitude, e.longitude], { icon: this.iconSelf });
        this.myMarker.setZIndexOffset(1);

      }
      this.selflayer.addLayer(this.myMarker);
      //this.myMarker.bindPopup("you are here").openPopup(leaflet.latLng([e.latitude, e.longitude]));
    }).on('locationerror', (err) => {
      console.log("ERROR: ", err.message);
      // we don't know our position, therefore focus whole map
      if(!this.location) this.map.fitWorld().zoomIn();
    })

  }

  openLink(e, url) {
    this.links.openLink(url);
  }

  centerOnMarker(location) {
    let marker = this.marker[location];

    //this.map.flyTo(marker._latlng, 18);
    this.map.setView(marker._latlng, 18);
    marker.openPopup(leaflet.latLng(marker._latlng));

  }
}

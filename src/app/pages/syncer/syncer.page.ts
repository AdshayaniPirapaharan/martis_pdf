import { Component, OnInit } from "@angular/core";
import { capSQLiteSet, JsonSQLite } from "@capacitor-community/sqlite";
import { AlertController, LoadingController } from "@ionic/angular";
import { VirtualTimeScheduler } from "rxjs";
import { InspectionService } from "src/app/services/create-inspection.service";
import { DatabaseService } from "src/app/services/database.service";
import { inspectionListService } from "src/app/services/inspection-list.service";
import { NetworkService } from "src/app/services/network.service";
import { SqliteService } from "src/app/services/sqlite.service";

@Component({
  selector: "app-syncer",
  templateUrl: "./syncer.page.html",
  styleUrls: ["./syncer.page.scss"],
})
export class SyncerPage implements OnInit {
  mainTests: any = [];
  localTests = [];
  log: string = "Press the SYNC button to begin syncing.";
  logs: string = "";
  exportedJson: string = "";
  deleteAllData: boolean = false;

  ///
  oExportTest = new ExportTest();

  showAlert = async (heading: string, message: string) => {
    let msg = this.alertCtrl.create({
      header: heading,
      message: message,
      buttons: ["OK"],
    });
    (await msg).present();
  };

  constructor(
    private _sqlite: SqliteService,
    private _dbService: DatabaseService,
    private alertCtrl: AlertController,
    private loadingCtrl: LoadingController,
    private network: NetworkService
  ) {}

  ngOnInit() {
    this.network.onNetworkChange().subscribe((data) => {
      console.log("NetStat:" + this.network.getCurrentNetworkStatus());
    });
  }

  async fullSync() {
    if (this.network.getCurrentNetworkStatus() == 1) {
      this.log =
        "You are currently not connected. Please connect to a network and try again.";
      return;
    }

    //loading spinner
    const loading = await this.loadingCtrl.create({
      message: "Syncing...",
    });
    await loading.present();

    try {
      // initialize the connection
      const db = await this._sqlite.createConnection(
        "martis",
        false,
        "no-encryption",
        1
      );

      // open db martis
      await db.open();

      // export json
      let jsonObj: any = await db.exportToJson("full");

      this.exportedJson += JSON.stringify(jsonObj.export);

      //this.logs = this.exportedJson;

      // test Json object validity
      let result = await this._sqlite.isJsonValid(
        JSON.stringify(jsonObj.export)
      );

      if (!result.result) {
        return Promise.reject(new Error("IsJsonValid export 'full' failed"));
      }

      // Close Connection to martis
      await this._sqlite.closeConnection("martis");

      //export to Main DB
      this._dbService.fullExportAll(jsonObj.export).subscribe(async (data) => {
        console.log("Export post method success?: ", data);

        if (data) {
          //import fully from mySQL
          let imported = await this._dbService.fullImportAll();

          // test Json object validity
          let result = await this._sqlite.isJsonValid(JSON.stringify(imported));

          if (!result.result) {
            return Promise.reject(new Error("IsJsonValid failed"));
          }

          // full import
          let ret = await this._sqlite.importFromJson(JSON.stringify(imported));

          if (ret.changes.changes === -1) {
            return Promise.reject(
              new Error("ImportFromJson 'full' dataToImport failed")
            );
          }
          //connect to martis

          //search for sync_table and create it

          //set sync date

          //show sync date

          //dismiss loader
          await loading.dismiss();
          this.log = "Successfully Synced!";
        } else {
          //dismiss loader
          await loading.dismiss();
          this.showAlert("Error", "Could not export DB data");
          return Promise.reject(
            new Error("Exporting unsuccessful. Try again later")
          );
        }
      });

      return Promise.resolve();
    } catch (err) {
      //dismiss loader
      await loading.dismiss();
      // Close Connection to martis
      await this._sqlite.closeConnection("martis");
      //error message
      this.showAlert("Failed", err.message);
      return Promise.reject(err);
    }
  }

  //testing function
  async fullImport() {
    if (this.network.getCurrentNetworkStatus() == 1) {
      this.log =
        "You are currently not connected. Please connect to a network and try again.";
      return;
    }

    //loading spinner
    const loading = await this.loadingCtrl.create({
      message: "Deleting data & Syncing...",
    });
    await loading.present();

    try {
      //import fully from mySQL
      let imported = await this._dbService.fullImportAll();

      // test Json object validity
      let result = await this._sqlite.isJsonValid(JSON.stringify(imported));

      if (!result.result) {
        return Promise.reject(new Error("IsJsonValid failed"));
      }

      // full import
      let ret = await this._sqlite.importFromJson(JSON.stringify(imported));

      if (ret.changes.changes === -1) {
        return Promise.reject(
          new Error("ImportFromJson 'full' dataToImport failed")
        );
      }
      //connect to martis

      //search for sync_table and create it

      //set sync date

      //show sync date

      //dismiss loader
      await loading.dismiss();
      this.log = "Successfully Synced!";
    } catch (err) {
      //dismiss loader
      await loading.dismiss();
      // Close Connection to martis
      await this._sqlite.closeConnection("martis");
      //error message
      this.showAlert("Failed", err.message);
      return Promise.reject(err);
    }
  }

  //testing function
  async partialExport() {
    try {
      // initialize the connection
      const db = await this._sqlite.createConnection(
        "martis",
        false,
        "no-encryption",
        1
      );

      // open db martis
      await db.open();

      // export json
      let jsonObj: any = await db.exportToJson("partial");

      this.exportedJson += JSON.stringify(jsonObj.export);

      //this.logs = this.exportedJson;

      // test Json object validity
      let result = await this._sqlite.isJsonValid(
        JSON.stringify(jsonObj.export)
      );

      if (!result.result) {
        return Promise.reject(new Error("IsJsonValid export 'full' failed"));
      }
      //this.log = "Json export valid";

      // Close Connection to martis
      await this._sqlite.closeConnection("martis");
    } catch (err) {
      // Close Connection to martis
      await this._sqlite.closeConnection("martis");
    }
  }

  wipeout() {
    this.deleteAllData = !this.deleteAllData;
  }
}

export class ExportTest {
  TestID: string;
  DateIssued: string;
  AssetID: string;
  InspectorID: string;
  Result: string;
  SupervisorID: string;
  DateCompleted: string;
  Frequency: string;
  Priority: string;
  TestModID: string;
  comments: string;
}

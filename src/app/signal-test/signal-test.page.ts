import { Component, OnInit } from "@angular/core";
import { FormBuilder, Validators } from "@angular/forms";
import { AlertController, Platform } from "@ionic/angular";
import { SetresultGroundsService } from "../services/setresult-grounds.service";
import { ActivatedRoute } from "@angular/router";
import { SqliteService } from "../services/sqlite.service";

@Component({
  selector: "app-signal-test",
  templateUrl: "./signal-test.page.html",
  styleUrls: ["./signal-test.page.scss"],
})
export class SignalTestPage implements OnInit {
  opost = new Posts();

  assetid: String;
  testid: String;

  //platform
  desktop: boolean;

  log: string = "";

  //confirm date
  confirm: boolean = false;

  createTestForm = this.formBuilder.group({
    AssetID: [
      "",
      [
        Validators.required,
        Validators.pattern("^A[0-9]{3}"),
        Validators.maxLength(4),
      ],
    ],
    TestID: [
      "",
      [
        Validators.required,
        Validators.pattern("^T[0-9]{3}"),
        Validators.maxLength(4),
      ],
    ],
    comment: [""],
    Result: [""],
    DateCompleted: [""],
  });

  constructor(
    private formBuilder: FormBuilder,
    private setresult: SetresultGroundsService,
	private _sqlite: SqliteService,
    private alertCtrl: AlertController,
    private route: ActivatedRoute,
    private plt: Platform
  ) {}

  get assetID() {
    return this.createTestForm.get("AssetID");
  }
  get testID() {
    return this.createTestForm.get("TestID");
  }
  get comment() {
    return this.createTestForm.get("comment");
  }
  get result() {
    return this.createTestForm.get("Result");
  }
  get date() {
    return this.createTestForm.get("DateCompleted");
  }

  ngOnInit() {
    console.log(this.route.snapshot.params.assetid);
    this.assetid = this.route.snapshot.params.assetid;
    this.testid = this.route.snapshot.params.testid;
    if (this.plt.is("mobile") || this.plt.is("android") || this.plt.is("ios")) {
      this.desktop = false;
    } else if (this.plt.is("desktop")) {
      this.desktop = true;
    }
  }

  async onSave() {
    this.opost = this.createTestForm.value;

    if (this.date.value == "" || this.confirm == false) {
      this.showAlert(false, "Please confirm inspection date.", true);
      return;
    }

    console.log("Page Saved", this.opost);

    if (this.desktop) {
      this.setresult.patch(this.opost).subscribe((data) => {
        console.log("Post method success?: ", data);
        if (data) {
          this.showAlert(true);
        } else {
          this.showAlert(false);
        }
      });
    } else {
      try {
        //connect
        const db = await this._sqlite.createConnection("martis",false,"no-encryption",1);
        this.log += "connected // "; //+ JSON.stringify(this.opost);
        //open
        await db.open();
        //insert
        let sqlcmd: string =
          "UPDATE test SET Result = ?, DateCompleted = ?, comments = ? WHERE id = ?";
        var p = this.opost;
        this.log += " // dC: " + this.date.value + " ";
        let postableChanges = [
			p.Result, 
			this.date.value, 
			p.comments, 
			p.TestID];

        let ret: any = await db.run(sqlcmd, postableChanges);

        this.log += "query run // " + ret.changes.changes;
        
		//check update
        if (ret.changes.changes === 0) {
          return Promise.reject(new Error("Execution failed"));
        }

        this.log += " // query updates //";
        // Close Connection Martis
        await this._sqlite.closeConnection("martis");

        await this.showAlert(true);
        return Promise.resolve();
      } catch (err) {}
    }
  }
  async showAlert(val, msg?, reset?: boolean) {
    await this.alertCtrl
      .create({
        header: val ? "Success" : "Error",
        message: val ? "Test added Sucessfully" : "Error: " + msg,
        buttons: [
          {
            text: "OK",
            handler: () => {
              if (!reset) {
                this.createTestForm.reset();
              }
            },
          },
        ],
      })
      .then((res) => res.present());
  }

  confirmez(){
	  this.confirm = !this.confirm;
  }
}

export class Posts {
  AssetID: string;
  TestID: string;
  DataCompleted: string;
  comments: string;
  Result: string;
}

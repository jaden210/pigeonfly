import {
  Component,
  Input,
  OnChanges,
  AfterViewInit,
  ViewChild,
  ElementRef
} from "@angular/core";

@Component({
  selector: "progress-shield",
  templateUrl: "./progress-shield.component.html",
  styleUrls: ["./progress-shield.component.css"]
})
export class ProgressShieldComponent implements OnChanges, AfterViewInit {
  @Input()
  complianceLevel: number;
  @ViewChild("myCanvas")
  canvas: ElementRef;
  color: string;
  scale: number;
  scaled: boolean;
  context;

  constructor() {}

  ngAfterViewInit() {
    this.context = this.canvas.nativeElement.getContext("2d");
    this.scale = window.devicePixelRatio || 1;
    this.context.scale(this.scale, this.scale);
    if (this.complianceLevel >= 0) this.draw(this.context);
  }

  ngOnChanges() {
    this.color =
      this.complianceLevel == 100
        ? "#00BFA5"
        : this.complianceLevel > 0
          ? "#FFD600"
          : "#F44336";
    if (this.context) {
      this.draw(this.context);
    }
  }

  private draw(context): void {
    const complianceLevel = this.complianceLevel || 0;
    let al = 0;
    const start = 4.72;
    const cw = context.canvas.width / (2 * this.scale);
    const ch = context.canvas.height / (2 * this.scale);
    let diff;
    var bar = setInterval(() => {
      diff = (al / 100) * Math.PI * 2;
      context.clearRect(0, 0, cw, ch);
      context.lineWidth = 2;
      context.beginPath();
      context.arc(cw, ch, 17, 0, 2 * Math.PI, false);
      context.fillStyle = "#FFF";
      context.fill();
      context.strokeStyle = "#e0e0e0";
      context.stroke();
      context.fillStyle = "#000";
      context.textAlign = "center";
      context.lineWidth = 4;
      context.beginPath();
      context.arc(cw, ch, 17, start, diff + start, false);
      context.strokeStyle = this.color;
      context.stroke();
      if (al >= complianceLevel) {
        clearTimeout(bar);
      }
      al++;
    }, 30);
  }
}

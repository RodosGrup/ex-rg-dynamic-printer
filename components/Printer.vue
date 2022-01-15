<template>
  <div id="rg-printer-container">
    <div id="dis-container" ref="rgDisContainer">
      <div class="rg-menu" v-if="onizlemeDurum && ciktiButonlarDurum">
        <button @click="indir({ tur: 'text' })" class="indir">İNDİR</button>
      </div>
      <div id="container-frame">
        <div id="cizim-container">
          <template v-for="(alan, i) in alanlar">
            <div
              ref="cizim"
              class="cizim"
              :class="alan.renk"
              :key="i"
              :id="alan.id"
              :style="alan.style"
            >
              {{ alan.deger }}
            </div>
          </template>
        </div>
      </div>
    </div>
    <div class="rg-menu-container" v-if="eklemeButonlarDurum">
      <div class="rg-menu" v-if="!onizlemeDurum && aktifAlan">
        <fieldset>
          <legend>Genel</legend>
          <button @click="buyut">Büyüt</button>
          <button @click="kucult">Küçült</button>
          <!-- <input type="color" id="head" name="renk" value="#e66465" /> -->
        </fieldset>
        <fieldset>
          <legend>Yatay İşlemler</legend>
          <button @click="solaYasla">Sola Yasla</button>
          <button @click="yatayOrtala">Ortala</button>
          <button @click="sagaYasla">Sağa Yasla</button>
        </fieldset>
        <fieldset>
          <legend>Dikey İşlemler</legend>
          <button @click="yukariYasla">Yukarı Yasla</button>
          <button @click="dikeyOrtala">Ortala</button>
          <button @click="asagiYasla">Aşağı Yasla</button>
        </fieldset>
        <fieldset>
          <legend>Aktif Alan</legend>
          <label for="deger">KOD:</label>
          <input type="text" v-model="alanlar[aktifAlan.id].kod" name="deger" />
          <label for="deger">DEĞER:</label>
          <input
            type="text"
            v-model="alanlar[aktifAlan.id].deger"
            name="deger"
          />
        </fieldset>
      </div>
      <div class="rg-menu" v-if="!onizlemeDurum">
        <button @click="alanEkle({ tur: 'text' })" class="ekle">
          Yeni Yazı Ekle
        </button>
        <button @click="alanEkle({ tur: 'image' })" class="ekle">
          Yeni Resim Ekle
        </button>
        <button @click="disaAktar()" class="cikti">Çıktı Al</button>
      </div>
    </div>
  </div>
</template>

<script>
import interact from "interactjs";
import { cloneDeep, forEach, size, findKey, merge } from "lodash";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";

export default {
  name: "Home",
  props: {
    options: {
      type: Object,
      default: () => ({}),
    },
    mod: {
      type: String,
      default: "onizleme",
    },
  },
  data() {
    return {
      varsayilanlar: {
        alanlar: {
          width: 150,
          height: 100,
          x: 0,
          y: 0,
        },
        style: {
          fontSize: "24px",
          justifyContent: "center",
          alignItems: "center",
        },
        container: {
          width: 1000,
          height: 1000,
        },
        otomatikSigdir: true,
      },
      _options: {},
      _turler: [
        {
          kod: "text",
          ad: "Metin",
        },
        {
          kod: "image",
          ad: "Resim",
        },
      ],
      alanlar: {},
      container: {
        el: null,
      },
      aktifAlan: null,
      olcek: 1,
      aktifContainer: "#cizim-container",
    };
  },
  mounted() {
    this.init();
  },
  methods: {
    init() {
      this.optionsInit();

      return this.containerInit().then(() => {
        this.alanlarObjesiInit();
        this.$nextTick(() => {
          this.interactInit();
        });
      });
    },
    optionsInit() {
      this._options = cloneDeep(this.varsayilanlar);
      // this._options = {
      //   ...this._options,
      //   ...this.options,
      // };
      // this._options.alanlar = {
      //   ...this.varsayilanlar.alanlar,
      //   ...this.options.alanlar,
      // };
      // this._options.style = {
      //   ...this.varsayilanlar.style,
      //   ...this.options.style,
      // };
      // this._options.container = {
      //   ...this.varsayilanlar.container,
      //   ...this.options.container,
      // };

      this._options = merge(this._options, this.options);
    },
    containerInit() {
      return new Promise((resolve, reject) => {
        this.container.el = document.querySelector(this.aktifContainer);

        if (this._options.otomatikSigdir) {
          const disContainer = {
            width: this.$refs.rgDisContainer.offsetWidth,
            height: this.$refs.rgDisContainer.offsetHeight,
          };
          if (this._options.container.width > disContainer.width) {
            this._options.container.width = disContainer.width;
            this._options.container.height = disContainer.width;
          } else if (this._options.container.height > disContainer.height) {
            console.log("YÜKSEKLİK PROBLEMİ");
          }
        }
        this.container.el.style.width = this._options.container.width + "px";
        this.container.el.style.height = this._options.container.height + "px";
        this.container.el.style.backgroundSize = "contain";
        this.container.el.style.backgroundImage = `url(${this._options.img})`;

        const _this = this;

        const img = new Image();
        img.onload = function () {
          if (this.width > this.height) {
            _this.olcek = _this._options.container.width / this.width;
            _this.container.el.style.height = `${this.height * _this.olcek}px`;
          } else {
            _this.olcek = _this._options.container.height / this.height;
            _this.container.el.style.width = `${this.width * _this.olcek}px`;
          }

          resolve();
        };
        img.src = this._options.img;
      });
    },
    alanlarObjesiInit() {
      if (!size(this._options.data) || !size(this._options.data.alanlar)) {
        console.warn("Bazı parametreler boş geçildi!");
        return;
      }

      this.alanlar = cloneDeep(this._options.data.alanlar);

      this.olcekInit();

      this.degerlerInit();

      this.alanlar = cloneDeep(this.alanlar);
    },
    olcekInit() {
      if (this.olcek !== this._options.data.olcek) {
        forEach(this.alanlar, (alan) => {
          alan.style.transform = `translate(${
            (alan._style.x * this.olcek) / this._options.data.olcek
          }px, ${(alan._style.y * this.olcek) / this._options.data.olcek}px)`;
          alan.style.width = `${
            (alan._style.width * this.olcek) / this._options.data.olcek
          }px`;
          alan.style.height = `${
            (alan._style.height * this.olcek) / this._options.data.olcek
          }px`;

          if (alan.tur === "text") {
            alan.style.fontSize = `${
              (parseInt(alan.style.fontSize) * this.olcek) /
              this._options.data.olcek
            }px`;
          }
        });
      }
    },
    degerlerInit() {
      if (size(this._options.degerler)) {
        forEach(this._options.degerler, (deger) => {
          const key = findKey(this.alanlar, {
            kod: deger.kod,
          });

          if (key) {
            this.alanlar[key].deger = deger.deger;
          }
        });
      }
    },
    interactInit() {
      const _this = this;
      const containerEl = document.getElementById(this.aktifContainer);

      const snap = interact.modifiers.snap({
        targets: [interact.snappers.grid({ x: 10, y: 10 })],
        range: Infinity,
        relativePoints: [{ x: 0, y: 0 }],
      });
      const restrict = interact.modifiers.restrictRect({
        restriction: containerEl,
        elementRect: { top: 1, left: 1, bottom: 1, right: 1 },
        endOnly: true,
      });

      interact(".cizim")
        .on("tap", function (event) {
          _this.oneCikar(event);
          event.preventDefault();
        })
        .draggable({
          manualStart: this.onizlemeDurum,
          modifiers: [snap, restrict],
          inertia: true,
          listeners: {
            start(event) {
              _this.oneCikar(event);
            },
            move(event) {
              const id = event.target.id;

              /* _this.alanlar[id]._style.x = parseFloat(_this.alanlar[id]._style.x) || 0;
              _this.alanlar[id]._style.y = parseFloat(_this.alanlar[id]._style.y) || 0; */

              _this.alanlar[id]._style.x =
                (parseFloat(_this.alanlar[id]._style.x) || 0) + event.dx;
              _this.alanlar[id]._style.y =
                (parseFloat(_this.alanlar[id]._style.y) || 0) + event.dy;

              event.target.style.transform = `translate(${_this.alanlar[id]._style.x}px, ${_this.alanlar[id]._style.y}px)`;

              _this.alanlar[
                id
              ].style.transform = `translate(${_this.alanlar[id]._style.x}px, ${_this.alanlar[id]._style.y}px)`;

              _this.konumYuzdeHesapla(event);
            },
          },
        })
        .resizable({
          manualStart: this.onizlemeDurum,
          edges: { top: true, left: true, bottom: true, right: true },
          listeners: {
            start(event) {
              _this.oneCikar(event);
            },
            move: function (event) {
              const id = event.target.id;
              _this.alanlar[id]._style.width = event.rect.width;
              _this.alanlar[id]._style.height = event.rect.height;

              _this.alanlar[id]._style.x =
                (parseFloat(_this.alanlar[id]._style.x) || 0) +
                event.deltaRect.left;
              _this.alanlar[id]._style.y =
                (parseFloat(_this.alanlar[id]._style.y) || 0) +
                event.deltaRect.top;

              Object.assign(event.target.style, {
                width: `${event.rect.width}px`,
                height: `${event.rect.height}px`,
                transform: `translate(${_this.alanlar[id]._style.x}px, ${_this.alanlar[id]._style.y}px)`,
              });

              Object.assign(event.target.dataset, {
                x: _this.alanlar[id]._style.x,
                y: _this.alanlar[id]._style.y,
              });

              _this.alanlar[
                id
              ].style.transform = `translate(${_this.alanlar[id]._style.x}px, ${_this.alanlar[id]._style.y}px)`;
              _this.alanlar[id].style.width = `${event.rect.width}px`;
              _this.alanlar[id].style.height = `${event.rect.height}px`;

              _this.konumYuzdeHesapla(event);
            },
          },
          modifiers: [snap, restrict],
        });
    },
    oneCikar(event) {
      const hedefEl = event.target;

      [...this.$refs.cizim].forEach((cizim) => {
        if (cizim.id !== hedefEl.id) {
          cizim.style.zIndex = "0";
          cizim.classList.remove("aktif");
        }
      });

      hedefEl.style.zIndex = "1";
      hedefEl.classList.add("aktif");
      this.aktifAlan = this.alanlar[hedefEl.id];
    },
    konumYuzdeHesapla(event) {
      const id = event.target.id;

      this.alanlar[id].xPer =
        (this.alanlar[id].x / this.container.el.style.width) * 100;
      this.alanlar[id].yPer =
        (this.alanlar[id].y / this.container.el.style.height) * 100;
    },
    buyut() {
      if (this.aktifAlan.tur === "text") {
        this.alanlar[this.aktifAlan.id].style.fontSize = `${
          parseInt(this.alanlar[this.aktifAlan.id].style.fontSize) + 1
        }px`;
      }
    },
    kucult() {
      if (this.aktifAlan.tur === "text") {
        this.alanlar[this.aktifAlan.id].style.fontSize = `${
          parseInt(this.alanlar[this.aktifAlan.id].style.fontSize) - 1
        }px`;
      }
    },
    solaYasla() {
      this.alanlar[this.aktifAlan.id].style.justifyContent = "start";
      this.alanlar[this.aktifAlan.id].style.textAlign = "start";

      this.alanlar = cloneDeep(this.alanlar);
    },
    yatayOrtala() {
      this.alanlar[this.aktifAlan.id].style.justifyContent = "center";
      this.alanlar[this.aktifAlan.id].style.textAlign = "center";

      this.alanlar = cloneDeep(this.alanlar);
    },
    sagaYasla() {
      this.alanlar[this.aktifAlan.id].style.justifyContent = "end";
      this.alanlar[this.aktifAlan.id].style.textAlign = "end";

      this.alanlar = cloneDeep(this.alanlar);
    },
    yukariYasla() {
      this.alanlar[this.aktifAlan.id].style.alignItems = "start";

      this.alanlar = cloneDeep(this.alanlar);
    },
    dikeyOrtala() {
      this.alanlar[this.aktifAlan.id].style.alignItems = "center";

      this.alanlar = cloneDeep(this.alanlar);
    },
    asagiYasla() {
      this.alanlar[this.aktifAlan.id].style.alignItems = "end";

      this.alanlar = cloneDeep(this.alanlar);
    },
    disaAktar() {
      this.alanlariDisaAktarimIcinHazirla();

      const cikti = JSON.stringify({
        alanlar: this.alanlar,
        olcek: this.olcek,
      });
      console.log("export", cikti);
    },
    alanlariDisaAktarimIcinHazirla() {
      forEach(this.alanlar, (alan) => {
        alan.style.border = "none";
      });
    },
    alanEkle({ tur }) {
      const baseId = Date.now();
      const width = 150;
      const height = 100;
      const x = 100;
      const y = 100;
      this.alanlar[baseId] = {
        id: baseId,
        kod: "AD",
        tur: tur,
        deger: "",
        style: {
          border: "1px dashed black !important",
          borderRadius: "8px",
          width: `${width}px`,
          height: `${height}px`,
          transform: `translate(${x}px, ${y}px)`,
        },
        _style: {
          width,
          height,
          x,
          y,
        },
        xPer: null,
        yPer: null,
      };

      if (tur === "text") {
        this.alanlar[baseId].style.fontSize = "24px";
      } else if (tur === "image") {
        this.alanlar[baseId].style.width = "200px";
        this.alanlar[baseId].style.height = "200px";
        this.alanlar[baseId].style.background =
          "url(https://picsum.photos/200/200)";
        this.alanlar[baseId].style.backgroundSize = "contain !important";
        this.alanlar[baseId].style.backgroundRepeat = "no-repeat";
        this.alanlar[baseId].style.backgroundPosition = "center";
      }

      console.log("alanEkle", this.alanlar);

      this.alanlar = cloneDeep(this.alanlar);
    },
    indir(options = {}) {
      const _this = this;

      html2canvas(this.container.el, {
        onclone(clonedDoc, container) {},
        backgroundColor: "#FFF",
      }).then((canvas) => {
        var a = document.createElement("a");
        a.href = canvas.toDataURL();
        a.download = "bilet.png";
        a.click();

        return options.callback();

        const containerWidth = parseInt(this.container.el.style.width);
        const containerHeight = parseInt(this.container.el.style.height);

        let yatay = containerWidth > containerHeight;

        const doc = new jsPDF({
          orientation: yatay ? "landscape" : "portrait",
          unit: "px",
          // format: "a4",
          format: yatay
            ? [containerWidth, containerHeight]
            : [containerHeight, containerWidth],
        });

        const padding = 0;

        let pdfWidth = doc.internal.pageSize.getWidth() - padding;
        let pdfHeight = doc.internal.pageSize.getHeight() - padding;

        // Eğer container genişliği A4 genişliğinden büyükse taşmamasını sağlamak için
        if (containerWidth - pdfWidth > containerHeight - pdfHeight) {
          yatay = false;
        } else {
          yatay = true;
        }

        let olusturulacakWidth = pdfWidth,
          olusturulacakHeight = pdfHeight;

        let olcek;
        if (yatay) {
          olcek = pdfWidth / containerWidth;
          olusturulacakHeight = containerHeight * olcek;
        } else {
          olcek = pdfHeight / containerHeight;
          olusturulacakWidth = containerWidth * olcek;
        }

        doc.addImage(
          canvas,
          "PNG",
          padding / 2,
          padding / 2,
          olusturulacakWidth,
          olusturulacakHeight
        );

        console.log("olusturulacakWidth", olusturulacakWidth);
        console.log("olusturulacakHeight", olusturulacakHeight);

        // var string = doc.output("datauristring");
        // var embed = "<embed width='100%' height='100%' src='" + string + "'/>";
        // var x = window.open();
        // x.document.open();
        // x.document.write(embed);
        // x.document.close();

        setTimeout(() => {
          const url = URL.createObjectURL(doc.output("blob"));
          window.open(url);
          if (options.callback) {
            options.callback();
          }
          setTimeout(() => {
            URL.revokeObjectURL(url);
          }, 60000);
        }, 500);

        // doc.save("bilet.pdf", { returnPromise: true }).then(() => {
        //   if (options.callback) {
        //     options.callback();
        //   }
        // });

        // doc.output("dataurlnewwindow");
      });
    },
    setDeger(kod, deger) {
      let alanKey = findKey(this.alanlar, { kod });

      if (alanKey) {
        this.alanlar[alanKey].deger = deger;

        this.alanlar = cloneDeep(this.alanlar);
      }
    },
  },
  computed: {
    onizlemeDurum() {
      return this.mod === "onizleme";
    },
    ciktiButonlarDurum() {
      return (
        !("ciktiButonlar" in this.options) ||
        this.options.ciktiButonlar === true
      );
    },
    eklemeButonlarDurum() {
      return (
        !("eklemeButonlar" in this.options) ||
        this.options.eklemeButonlar === true
      );
    },
  },
};
</script>

<style scoped>
* {
  box-sizing: border-box;
}

button {
  margin: 0;
  padding: 0;
  border: 0;
  background: none;
  font-size: inherit;
  font-family: inherit;
  font-weight: inherit;
  color: inherit;
  cursor: pointer;
  outline: inherit;
}

@font-face {
  font-family: myFirstFont;
  /* /Applications/MAMP/htdocs/hurkus/public/fonts/Pacifico-Regular.ttf */
  src: url(/fonts/BebasKai.ttf);
}

.rg-menu-container {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}

.cizim {
  min-width: 25px;
  min-height: 25px;
  padding: 4px;
  touch-action: none;
  user-select: none;
  position: absolute;
  margin: 0 auto;
  display: flex;
}

#dis-container {
  font-family: myFirstFont;
  display: flex;
  justify-content: center;
}

#cizim-container {
  position: relative;
}

#container-frame {
  padding: 12px;
  width: fit-content;
  height: fit-content;
}

.rg-menu {
  display: flex;
  flex-wrap: wrap;
  flex-direction: row;
  gap: 4px;
  align-items: center;
}

.rg-menu fieldset {
  display: flex;
  margin: 0 8px;
  border-radius: 4px;
  padding: 4px;
  align-items: center;
  justify-content: center;
}

.rg-menu fieldset legend {
  margin: 0 8px;
  padding: 0 4px;
  font-size: 12px;
}

.rg-menu button {
  padding: 8px;
  transition: all 0.2s;
  margin: 8px;
  border: 1px solid #ccc;
  border-radius: 4px;
}

.rg-menu input {
  padding: 8px;
  transition: all 0.2s;
  margin: 8px;
  border: 1px solid black;
  border-radius: 4px;
}

.rg-menu button:hover {
  background-color: #ccc;
  cursor: pointer;
}

.rg-menu button:active {
  background-color: rgb(121, 121, 121);
}

.rg-menu button.ekle {
  padding: 4px;
  background-color: #00bcd4;
  color: white;
  max-width: 200px;
  height: 100%;
  border-radius: 4px;
}

.rg-menu button.ekle:hover {
  background-color: #00e1ff;
  transform: scale(1.1);
}

.rg-menu button.ekle:active {
  background-color: #007b8b;
}

.rg-menu button.cikti {
  padding: 4px;
  background-color: #d40000;
  color: white;
  max-width: 100px;
  height: 100%;
  border-radius: 4px;
}

.rg-menu button.cikti:hover {
  background-color: #ff0000;
  transform: scale(1.1);
}

.rg-menu button.cikti:active {
  background-color: #8b0000;
}

.rg-menu button.indir {
  padding: 4px;
  background-color: #31d400;
  color: white;
  max-width: 100px;
  height: 100%;
  border-radius: 4px;
}

.rg-menu button.indir:hover {
  background-color: #33ff00;
  transform: scale(1.1);
}

.rg-menu button.indir:active {
  background-color: #208b00;
}

/* .rg-menu input[type="color"] {
  width: 25px;
  height: 25px;
}

.rg-menu button:not(:nth-child(2)) {
  border-left: #ccc 1px solid;
} */
</style>
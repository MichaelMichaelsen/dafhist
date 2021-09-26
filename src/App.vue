<template>
  <div id="app">
    <b-navbar toggleable="lg" type="dark" variant="danger">
      <b-navbar-brand href="#">Dafhist (1.1)</b-navbar-brand>
      <b-navbar-toggle target="nav-collapse"></b-navbar-toggle>
    </b-navbar>
    <b-container fluid>
      <h1>{{service}} - Historik</h1>
      <div class="row">
        <div class="col" col-sm-6>
          <b-form @submit.stop.prevent>
            <b-form-group id="inputform">
              <label for="serviceselect">Service</label>
              <b-form-select id="serviceselect" v-model="service" :options="darservices"></b-form-select>
            </b-form-group>
            <b-form-group>
              <label for="uuid">{{service}} UUID</label>
              <b-input v-model="idlokalId" type="text" id="uuid" required size="35"></b-input>
            </b-form-group>
          </b-form>
        </div>
      </div>
      <div class.row>
        <div class="col col-sm-3">
          <b-form @submit.stop.prevent>
            <b-form-group>
              <label for="registreringFra">Registrering Fra</label>
              <b-input v-model="registreringFra" type="text" id="registreringFra" size="35"></b-input>
            </b-form-group>
            <b-form-group>
              <label for="virkningFra">Virkning Fra</label>
              <b-input v-model="virkningFra" type="text" id="virkningFra" size="35"></b-input>
            </b-form-group>
          </b-form>
        </div>
      </div>
      <div class="row">
        <div class="col col-sm-6">
          <h3>Samples</h3>
          <div class="list-group list-group-flush">
            <b-button
              type="button"
              class="list-group-item list-group-item-action text-monospace"
              @click="updateUUID(uuid)"
              v-for="(uuid,uuidindex) in sampleUUID"
              :key="uuidindex"
            >{{uuidindex+1}}. {{ uuid }}</b-button>
          </div>
        </div>
      </div>
      <div class="row">
        <div class="col col-sm-12">
          <hr />
          <a
            :href="url"
            class="btn btn-info"
            role="button"
            aria-disabled="true"
            target="_blank"
          >{{ url }}</a>
          <b-button variant="primary" @click="findAdresse()">Lookup</b-button>
          <p>Request status er {{ requestStatus }}.</p>
          <p>Der er fundet {{ adresser.length }} instans(er). Adressebetegnelse {{ adressebetegnelse }}</p>
          <a
            href="https://confluence.datafordeler.dk/pages/viewpage.action?pageId=16056354"
            role="button"
            class="btn btn-info"
            aria-disabled="true"
            target="_blank"
          >Dokumentation</a>
        </div>
      </div>

      <b-table striped hover :items="tableRow"></b-table>

      <div>
        <div id="Area"></div>
      </div>
    </b-container>
  </div>
</template>

<script>
import axios from "axios";
import * as d3 from "d3";
var darStatusCode = [
  "None",
  "Intern forberedelse",
  "Foreløbig",
  "Gældende",
  "Nedlagt",
  "Henlagt",
  "Slettet",
  "Ikke i brug",
  "I brug",
  "Udgået"
];
export default {
  data() {
    return {
      responseURL: "https://services.datafordeler.dk/DAR/DAR/1/rest/Adresse",
      displayURL: "https://services.datafordeler.dk/DAR/DAR/1/rest/Adresse",
      idlokalId: "4e906e30-ee35-452c-b1fc-138d3727d3e5",
      requestStatus: 0,
      adressebetegnelse: "",
      registreringFra: "0001-01-01T00:00:00",
      virkningFra: "0001-01-01T00:00:00",
      service: "Adresse",
      adresser: {},
      timestamps: [],
      sortedtimestamps: [],
      vector: [],
      tableRow: [],
      darservices: [
        "Adresse",
        "Husnummer",
        "Navngivenvej",
        "Navngivenvejkommunedel",
        "Postnummer",
        "Supplerendebynavn"
      ],
      sampleUUID: [
        "e447309b-a443-410e-8fa1-f1b3733f55f5",
        "0a3f50a4-a914-32b8-e044-0003ba298018",
        "0a3f50bc-159a-32b8-e044-0003ba298018",
        "29d450c3-4d1b-4f70-b5c3-67d06110ca21",
        "b3fbe76e-fc0d-40e7-8e18-33d72ec6a323",
        "ad0204ed-bf34-46d3-aaee-1d529b78335f",
        "64eea1e1-3b9f-4458-b2e8-0001cec6eec6"
      ]
    };
  },
  computed: {
    url() {
      this.responseURL =
        "https://services.datafordeler.dk/DAR/DAR/1/rest/" + this.service;
      return (
        "https://services.datafordeler.dk/DAR/DAR/1/rest/" +
        this.service +
        "?id=" +
        this.idlokalId +
        "&format=json" +
        "&virkningFra=" +
        this.virkningFra
      );
    }
  },
  methods: {
    updateUUID(uuid) {
      this.idlokalId = uuid;
    },
    buildURL() {
      this.responseURL =
        "https://services.datafordeler.dk/DAR/DAR/1/rest/" + this.service;
      this.displayURL =
        "https://services.datafordeler.dk/DAR/DAR/1/rest/" +
        this.service +
        "?id=" +
        this.idlokalId +
        "&format=json" +
        "&virkningFra=" +
        this.virkningFra;
    },
    registreTimestamp(timestamp) {
      if (timestamp) {
        this.timestamps.push(timestamp);
      }
    },
    getTimeStampIndex(timestamp) {
      let retindex = null;
      if (timestamp) {
        retindex = _.indexOf(this.sortedtimestamps, timestamp);
      }
      return retindex;
    },
    darStatus(code) {
      return darStatusCode[code] + " (" + code + ")";
    },
    timeLabels(i) {
      if (i > this.sortedtimestamps.length - 1) {
        return "oo";
      } else {
        return this.sortedtimestamps[i].substring(0, 19).replace("T", " ");
      }
    },
    findAdresse() {
      this.adressebetegnelse = "";
      this.adresser = [];
      this.timestamps = [];
      this.sortedtimestamps = [];
      this.vector = [];
      this.tableRow = [];
      d3.select("svg").remove();
      this.getAdresse(this.idlokalId);
    },
    getAdresse(uuid) {
      axios
        .get(this.responseURL, {
          params: {
            id: this.idlokalId,
            format: "json",
            registreringFra: this.registreringFra
          }
        })
        .then(res => {
          console.log(res);
          this.requestStatus = res.status;
          this.responseURLd = res.request.responseURL;
          res.data.sort(function(a, b) {
            return a.registreringFra > b.registreringFra;
          });
          this.adresser = res.data;
          var darStatus = this.darStatus;

          for (var i in res.data) {
            this.registreTimestamp(res.data[i].virkningFra);
            this.registreTimestamp(res.data[i].virkningTil);
            this.registreTimestamp(res.data[i].registreringFra);
            this.registreTimestamp(res.data[i].registreringTil);
          }
          let sortedtm = this.timestamps.sort();
          this.sortedtimestamps = _.sortedUniq(sortedtm);
          console.log(this.sortedtimestamps);
          this.adressebetegnelse = res.data[0].adressebetegnelse;
          //
          // Create a list of vectors from the original array to the uniq array
          //
          for (var i in res.data) {
            let status = res.data[i].status;
            let virkningFraIndex = this.getTimeStampIndex(
              res.data[i].virkningFra
            );
            let virkningTilIndex = this.getTimeStampIndex(
              res.data[i].virkningTil
            );
            let registreringFraIndex = this.getTimeStampIndex(
              res.data[i].registreringFra
            );
            let registreringTilIndex = this.getTimeStampIndex(
              res.data[i].registreringTil
            );
            let timestampVector = {
              id: i,
              status: status,
              virkningFra: {
                timestamp: res.data[i].virkningFra,
                position: virkningFraIndex
              },
              virkningTil: {
                timestamp: res.data[i].virkningTil,
                position: virkningTilIndex
              },
              registreringFra: {
                timestamp: res.data[i].registreringFra,
                position: registreringFraIndex
              },
              registreringTil: {
                timestamp: res.data[i].registreringTil,
                position: registreringTilIndex
              }
            };
            console.log(timestampVector);
            this.vector.push(timestampVector);

            let row = {
              nr: +i + 1,
              status: this.darStatus(status),
              virkningFra: res.data[i].virkningFra,
              virkningTil: res.data[i].virkningTil,
              registreringFra: res.data[i].registreringFra,
              registreringTil: res.data[i].registreringTil
            };
            this.tableRow.push(row);
          }
          //
          // the graph
          //
          var maxxlength = this.sortedtimestamps.length + 1;
          var maxylength = res.data.length;
          var lineHeight = 80;
          var graphHeight = (res.data.length + 1) * lineHeight;
          console.log(graphHeight);
          var margin = { top: 40, right: 40, bottom: 30, left: 60 },
            width = 1300 - margin.left - margin.right,
            height = graphHeight - margin.top - margin.bottom + lineHeight;

          var svg = d3
            .select("#Area")
            .append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
            .append("g")
            .attr(
              "transform",
              "translate(" + margin.left + "," + margin.top + ")"
            );

          var x = d3
            .scaleLinear()
            .domain([1, maxxlength])
            .nice()
            .range([0, width]);

          var y = d3
            .scaleLinear()
            .domain([0, maxylength + 1])
            .range([0, height]);

          //var xAxisTop    = d3.axisTop(x).ticks(8);
          var xAxisTop = d3
            .axisTop(x)
            .ticks(maxxlength)
            .tickFormat((d, i) => this.timeLabels(i));
          var xAxisBottom = d3
            .axisBottom(x)
            .ticks(maxxlength)
            .tickFormat((d, i) => this.timeLabels(i));
          var yAxisLeft = d3.axisLeft(y).ticks(maxylength);
          var yAxisRight = d3.axisRight(y);
          var strokeWidth = 4;
          var lineDist = 0.4;
          var lineBeforeDist = 1 - lineDist / 2.0;
          var lineAfterDist = 1 + lineDist / 2.0;

          svg
            .append("g")
            .attr("transform", "translate(0," + height + ")")
            .call(xAxisBottom);

          svg.append("g").call(xAxisTop);

          svg.append("g").call(yAxisLeft);

          svg
            .append("g")
            .attr("transform", "translate(" + width + ",0)")
            .call(yAxisRight);

          svg
            .selectAll("whatever")
            .data(this.vector)
            .enter()
            .append("line")
            .attr("x1", function(d) {
              return x(
                d.virkningFra.timestamp ? d.virkningFra.position + 1 : 0
              );
            })
            .attr("y1", function(d) {
              return y(+d.id + lineBeforeDist);
            })
            .attr("x2", function(d) {
              return x(
                d.virkningTil.timestamp
                  ? d.virkningTil.position + 1
                  : maxxlength
              );
            })
            .attr("y2", function(d) {
              return y(+d.id + lineBeforeDist);
            })
            .attr("stroke-width", strokeWidth)
            .attr("stroke", "blue");

          svg
            .selectAll("whatever")
            .data(this.vector)
            .enter()
            .append("line")
            .attr("x1", function(d) {
              return x(
                d.registreringFra.timestamp ? d.registreringFra.position + 1 : 0
              );
            })
            .attr("y1", function(d) {
              return y(+d.id + lineAfterDist);
            })
            .attr("x2", function(d) {
              return x(
                d.registreringTil.timestamp
                  ? d.registreringTil.position + 1
                  : maxxlength
              );
            })
            .attr("y2", function(d) {
              return y(+d.id + lineAfterDist);
            })
            .attr("stroke-width", strokeWidth)
            .attr("stroke", "red");

          svg
            .selectAll("whatever")
            .data(this.vector)
            .enter()
            .append("text")
            .attr("x", function(d) {
              return x(
                d.registreringFra.timestamp ? d.registreringFra.position + 1 : 1
              );
            })
            .attr("y", function(d) {
              return y(+d.id + 1);
            })
            .text(function(d, i) {
              return i + 1 + ". " + darStatus(d.status);
            })
            .attr("font-family", "sans-serif")
            .attr("font-size", "14px")
            .attr("fill", "black")
            .attr("dominant-baseline", "central");
        })
        .catch(error => {
          console.log(error);
          this.requestStatus = error.status;
        });
    }
  },
  created() {
    this.getAdresse("4e906e30-ee35-452c-b1fc-138d3727d3e5");
  }
};
</script>
<style>
.list-group-item {
  padding: 1px 1px;
}
</style>
<style>
</style>

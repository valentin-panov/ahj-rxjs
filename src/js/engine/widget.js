/* eslint-disable default-case */
/* eslint-disable no-param-reassign */
/* eslint-disable class-methods-use-this */

import { interval, of, timer } from 'rxjs';
import { ajax } from 'rxjs/ajax';
import { catchError, delayWhen, map, mergeMap, repeatWhen, tap, timestamp } from 'rxjs/operators';

import { unit, container } from './template';

export default class Widget {
  constructor() {
    this.idSet = new Set();
    this.error = null;
  }

  init() {
    this.renderContainer();
    this.bindToDOM();
    this.addListeners();
    this.streamSubsrcb();
  }

  renderContainer() {
    document.body.append(container());

    const zeroEl = {
      id: 'zero',
      from: '@helper',
      subject: 'NO NEW MESSAGES',
      body: 'Long message body here',
      received: Date.now(),
    };
    this.noMesssagesUnit = unit(zeroEl);
  }

  bindToDOM() {
    this.wrapper = document.querySelector('div.wrapper');
    this.clearer = document.querySelector('.btn');
    this.unitList = document.querySelector('ul.unit-list');
    this.unitList.prepend(this.noMesssagesUnit);
  }

  addUnit(element) {
    this.noMesssagesUnit.remove();
    const newUnit = unit(element);
    this.unitList.prepend(newUnit);
  }

  addListeners() {
    this.clearer.addEventListener(
      'click',
      (event) => {
        event.preventDefault();
        this.clearList();
      },
      false
    );
  }

  streamSubsrcb() {
    this.message$ = interval(3000)
      .pipe(
        mergeMap(() =>
          // ajax.getJSON('http://localhost:3000/messages/unread').pipe(
          ajax.getJSON('https://rxjs-email.herokuapp.com/messages/unread').pipe(
            map((response) => {
              const newMsgs = response.messages.filter((message) => !this.idSet.has(message.id));
              newMsgs.forEach((message) => this.idSet.add(message.id));
              return newMsgs;
            }),
            catchError(() => {
              of([]);
            })
            // repeatWhen((errors) =>
            //   errors.pipe(
            //     tap((val) => console.log(`Value ${val} was missed!`)),
            //     delayWhen((val) => timer(val * 1000))
            //   )
            // )
          )
        )
      )
      .subscribe((response) => {
        response.forEach((element) => this.addUnit(element));
      });
  }

  streamUnSubsrcb() {
    this.message$.unsubscribe();
  }

  clearList() {
    this.unitList.innerHTML = '';
    this.idSet.clear();
    this.createReq({ method: 'GET' });
    this.unitList.prepend(this.noMesssagesUnit);
  }

  async createReq(options) {
    const baseURL = 'https://rxjs-email.herokuapp.com/messages/clear';
    // const baseURL = 'http://localhost:3000/messages/clear';
    const requestURL = `${baseURL}?${options.query}`;
    const request = await fetch(requestURL, {
      method: options.method,
      headers: new Headers({ 'content-type': 'application/json' }),
      body: options.data ? JSON.stringify(options.data) : null,
    });
    const response = await request.json();
    return response;
  }
}

import angular from 'angular';

let filtersModule = angular.module('app.filters', []);

import MinutesSeconds from './minutes-seconds.filter';
filtersModule.filter('minutesSeconds', MinutesSeconds);

import PartOfSpeechAbbrev from './part-of-speech-abbrev.filter';
filtersModule.filter('partOfSpeechAbbrev', PartOfSpeechAbbrev);

import PrettyPercentage from './pretty-percentage.filter';
filtersModule.filter('prettyPercentage', PrettyPercentage);

import TimeDeltaInWords from './time-delta-in-words.filter';
filtersModule.filter('timeDeltaInWords', TimeDeltaInWords);

import MinutesToHours from './minutes-to-hours.filter';
filtersModule.filter('minutesToHours', MinutesToHours);

import MinutesToDaysHoursMinutes from './minutes-to-days-hours-minutes.filter';
filtersModule.filter('minutesToDaysHoursMinutes', MinutesToDaysHoursMinutes);

export default filtersModule;

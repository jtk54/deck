'use strict';

import _ from 'lodash';
import {ACCOUNT_SERVICE} from 'core/account/account.service';
import {APPLICATION_READ_SERVICE} from 'core/application/service/application.read.service';
import {APPLICATION_WRITE_SERVICE} from 'core/application/service/application.write.service';
import {APPLICATION_NAME_VALIDATION_MESSAGES} from './validation/applicationNameValidationMessages.component';
import {TASK_READ_SERVICE} from 'core/task/task.read.service';
import {VALIDATE_APPLICATION_NAME} from './validation/validateApplicationName.directive';
import {CHAOS_MONKEY_NEW_APPLICATION_CONFIG_COMPONENT} from 'core/chaosMonkey/chaosMonkeyNewApplicationConfig.component';

let angular = require('angular');

module.exports = angular
  .module('spinnaker.application.create.modal.controller', [
    require('angular-ui-router'),
    APPLICATION_WRITE_SERVICE,
    APPLICATION_READ_SERVICE,
    ACCOUNT_SERVICE,
    TASK_READ_SERVICE,
    require('../../config/settings'),
    APPLICATION_NAME_VALIDATION_MESSAGES,
    VALIDATE_APPLICATION_NAME,
    require('./applicationProviderFields.component.js'),
    require('./groupMembershipConfigurer.component.js'),
    CHAOS_MONKEY_NEW_APPLICATION_CONFIG_COMPONENT,
  ])
  .controller('CreateApplicationModalCtrl', function($scope, $q, $log, $state, $uibModalInstance, accountService,
                                                     applicationWriter, applicationReader, taskReader, $timeout,
                                                     settings) {

    let applicationLoader = applicationReader.listApplications();
    applicationLoader.then((applications) => this.data.appNameList = _.map(applications, 'name'));

    let accountLoader = accountService.listAccounts();
    accountLoader.then((accounts) => this.data.accounts = accounts);

    let providerLoader = accountService.listProviders();
    providerLoader.then((providers) => this.data.cloudProviders = providers);

    $q.all([accountLoader, applicationLoader, providerLoader]).then(() => this.state.initializing = false);

    this.state = {
      initializing: true,
      submitting: false,
      errorMessages: [],
    };
    this.data = {

    };
    this.application = {
      accounts: [],
      cloudProviders: [],
      instancePort: settings.defaultInstancePort || null,
    };

    let submitting = () => {
      this.state.errorMessages = [];
      this.state.submitting = true;
    };

    let goIdle = () => {
      this.state.submitting = false;
    };

    var navigateTimeout = null;

    let routeToApplication = () => {
      navigateTimeout = $timeout(() => {
        $state.go(
          'home.applications.application.insight.clusters', {
            application: this.application.name,
          }
        );
      }, 1000 );
    };

    $scope.$on('$destroy', () => $timeout.cancel(navigateTimeout));


    let waitUntilApplicationIsCreated = (task) => {
      return taskReader.waitUntilTaskCompletes(task)
        .then(routeToApplication, () => {
          this.state.errorMessages.push('Could not create application: ' + task.failureMessage);
          goIdle();
        });
    };

    let createApplicationFailure = () => {
      this.state.errorMessages.push('Could not create application');
      goIdle();
    };

    this.createApplication = () => {
      return applicationWriter.createApplication(this.application)
        .then(waitUntilApplicationIsCreated, createApplicationFailure);
    };

    this.updateCloudProviderHealthWarning = () => {
      if (!this.application.platformHealthOnlyShowOverride) {
        // Show the warning if platformHealthOnlyShowOverride is being enabled.
        this.data.showOverrideWarning = `Simply enabling the "Consider only cloud provider health when executing tasks"
          option above is usually sufficient for most applications that want the same health provider behavior for
          all stages. Note that pipelines will require manual updating if this setting is disabled in the future.`;
      }
    };

    this.submit = () => {
      submitting();
      this.application.name = this.application.name.toLowerCase();
      if (this.data.cloudProviders.length === 1) {
        this.application.cloudProviders = this.data.cloudProviders;
      }
      this.createApplication();

    };

  });

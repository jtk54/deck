import {module, isArray, IComponentController, IComponentOptions} from 'angular';
import {IStateService} from 'angular-ui-router';
import {Property} from '../domain/property.domain';

import { flatten, values } from 'lodash';
import {IApplicationStateParams} from 'core/application/application.state.provider';

export class FastPropertyPodsController implements IComponentController {

  public properties: any[];

  static get $inject() {
    return [
      '$state',
      '$stateParams'
    ];
  }

  public $onInit() {
    this.resetPropertyDetails();
  }

  constructor(private $state: IStateService,
              public $stateParams: IApplicationStateParams) {}


  public isPropertyListArray(): boolean {
    return isArray(this.properties);
  }

  public isGrouped(): boolean {
    return !this.isPropertyListArray();
  }

  private isDetailInPropInList(): boolean {
    let included = false;

    if (this.isPropertyListArray()) {
      included = this.properties.some(this.hasPropId.bind(this));
    } else {
      included = flatten(values(this.properties)).some(this.hasPropId.bind(this));
    }
    return included;
  }

  private hasPropId(prop: Property): boolean {
    return prop.propertyId === this.$stateParams['propertyId'];
  }

  private resetPropertyDetails(): void {
    if (this.$stateParams['propertyId'] && !this.isDetailInPropInList()) {
      delete this.$stateParams['propertyId'];
      this.$state.go('home.data.properties', this.$stateParams);
    }
  }

}

class FastPropertyPods implements IComponentOptions {
  public templateUrl: string = require('./fastPropertyPods.html');
  public controller: any = FastPropertyPodsController;
  public controllerAs = 'fpPod';
  public bindings: any = {
    properties: '<',
    groupedBy: '=?'
  };
}

export const FAST_PROPERTY_PODS = 'spinnaker.netflix.globalFastProperty.pods.component';

module(FAST_PROPERTY_PODS, [
  require('angular-ui-router'),
])
  .component('fastPropertyPods', new FastPropertyPods());


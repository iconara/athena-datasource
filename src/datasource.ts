import { DataSourceInstanceSettings, ScopedVars } from '@grafana/data';
import { DataSourceWithBackend, getTemplateSrv } from '@grafana/runtime';
import { AthenaDataSourceOptions, AthenaQuery } from './types';
import { AthenaVariableSupport } from './variables';

export class DataSource extends DataSourceWithBackend<AthenaQuery, AthenaDataSourceOptions> {
  defaultRegion = '';
  defaultCatalog = '';
  defaultDatabase = '';

  constructor(instanceSettings: DataSourceInstanceSettings<AthenaDataSourceOptions>) {
    super(instanceSettings);
    this.defaultRegion = instanceSettings.jsonData.defaultRegion || '';
    this.defaultCatalog = instanceSettings.jsonData.catalog || '';
    this.defaultDatabase = instanceSettings.jsonData.database || '';
    this.variables = new AthenaVariableSupport(this);
  }

  // This will support annotation queries for 7.2+
  annotations = {};

  /**
   * Do not execute queries that do not exist yet
   */
  filterQuery(query: AthenaQuery): boolean {
    return !!query.rawSQL;
  }

  applyTemplateVariables(query: AthenaQuery, scopedVars: ScopedVars): AthenaQuery {
    const templateSrv = getTemplateSrv();
    return {
      ...query,
      rawSQL: templateSrv.replace(query.rawSQL, scopedVars, this.interpolateVariable),
    };
  }

  private interpolateVariable = (value: string | string[]) => {
    if (typeof value === 'string') {
      return value;
    }

    const quotedValues = value.map((v) => {
      return this.quoteLiteral(v);
    });
    return quotedValues.join(',');
  };

  private quoteLiteral(value: any) {
    return "'" + String(value).replace(/'/g, "''") + "'";
  }
}

import React, { Component, Fragment } from 'react';
import { Route } from 'react-router-dom';

import IcoHomeVC from './ico/vc/IcoHomeVC';

interface RouterModel {
  path: string;
  component: any;
  exact?: boolean;
}

class Router extends Component<{}, {}> {
  route = [
    {
      path: '/',
      component: IcoHomeVC,
      exact: true,
    },
  ];

  render() {
    return (
      <Fragment>
        {this.route.map((item, index) => {
          return (
            <Route
              key={index}
              exact={item.exact}
              path={item.path}
              render={props => <item.component {...props} {...this.props} />}
            />
          );
        })}
      </Fragment>
    );
  }
}

export default Router;

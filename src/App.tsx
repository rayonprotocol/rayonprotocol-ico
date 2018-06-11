import React, { Component, Fragment } from 'react';

// dc
import ContractDC from 'common/dc/ContractDC';

// view
import Router from './Router';

interface AppState {
  isInstanceReady: boolean;
}

class App extends Component<{}, AppState> {
  state = {
    ...this.state,
  };

  componentWillMount() {
    ContractDC.setInstanceReadyListner(this.instanceGetReady.bind(this));
    ContractDC.contractInit();
  }

  instanceGetReady() {
    this.setState({ ...this.state, isInstanceReady: true });
  }

  render() {
    const { isInstanceReady } = this.state;
    console.log('isInstanceReady', isInstanceReady);
    return (
      <div>
        {isInstanceReady && (
          <Fragment>
            <Router />
          </Fragment>
        )}
      </div>
    );
  }
}
export default App;

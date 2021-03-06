import eth from '../services/ethereumService';
import config from '../../config/config.json';

export const changeNetwork = network => ({
  type: 'NETWORK_CHANGE',
  network,
});

export const setAccount = account => ({
  type: 'SET_ACCOUNT',
  account,
});

export const changeAccount = account => ({
  type: 'ACCOUNT_CHANGE',
  account,
});

export const userNotRegistered = () => ({
  type: 'USER_NOT_REGISTERED',
  stage: 'register',
});

export const userIsRegistered = data => ({
  type: 'USER_IS_REGISTERED',
  stage: 'signIn',
  data,
});

export const registerSuccess = data => ({
  type: 'REGISTER_SUCCESS',
  data,
});

export const registerError = error => ({
  type: 'REGISTER_ERROR',
  error,
});

export const authError = error => ({
  type: 'AUTH_ERROR',
  isFetching: false,
  stage: 'authError',
  error,
});

export const wrongNetwork = () => ({
  type: 'WRONG_NETWORK',
  stage: 'wrongNetwork',
});

export const loginSuccess = data => ({
  type: 'LOGIN_SUCCESS',
  data,
});

export const noConnection = () => ({
  type: 'NO_CONNECTION',
  stage: 'noConnection',
});

export const unsecureContext = () => ({
  type: 'UNSECURE_CONTEXT',
  stage: 'unsecureContext',
});

export const logout = () => ({
  type: 'CLEAR_STORE',
});

export const contactsSuccess = contacts => ({
  type: 'CONTACTS_SUCCESS',
  contacts,
});

export const userIsRegistering = (account) => {
  localStorage.setItem(`isregistering-${account}`, true);
};

export const userRegistrationMined = (account) => {
  localStorage.removeItem(`isregistering-${account}`);
};

export const checkRegistration = () => (dispatch) => {
  if (!window.isSecureContext && window.isSecureContext !== undefined) {
    dispatch(unsecureContext());
    return;
  }

  eth.getWeb3Status()
    .then(() => eth.checkRegistration())
    .then((data) => {
      if (config.useLocalStorage) {
        userRegistrationMined(data.address);
      }
      dispatch(userIsRegistered(data));
      return eth.signIn(data.mail);
    })
    .then((result) => {
      if (result.status) {
        return dispatch(loginSuccess(result));
      }
      console.error(result.error);
      return dispatch(authError('You need to sign the string in order to login.'));
    })
    .catch((result) => {
      console.error(result);
      if (window.web3 === undefined) {
        return dispatch(noConnection());
      }
      if (!result.error && result.notRegistered) {
        return dispatch(userNotRegistered());
      }
      if (result.message === 'WRONG_NETWORK') {
        return dispatch(wrongNetwork());
      }
      return dispatch(authError(
        'Something went wrong or you didn\'t accept the signing process.',
      ));
    });
};

export const startListener = () => (dispatch) => {
  if (config.useLocalStorage) {
    eth.listenUserRegistered((event) => {
      userRegistrationMined(event.args.addr);
      dispatch(checkRegistration());
    });
  }
};

export const registerUser = mailAddress => (dispatch, getState) => {
  eth.getAccount()
    .then(account =>
      eth.checkMailAddress(mailAddress)
        .then(() => eth.signString(account, config.stringToSign))
        .then(signedString => eth._registerUser(mailAddress, signedString))
        .then((data) => {
          if (config.useLocalStorage) {
            userIsRegistering(getState().user.activeAccount);
          }
          dispatch(registerSuccess(data));
        })
        .catch((error) => {
          dispatch(registerError(error.message));
        }));
};


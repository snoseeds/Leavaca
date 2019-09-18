const start = () => {
  const frontEndHost = window.location.href.includes('http')
    ? 'https://snoseeds.github.io/Leavaca/UI'
    : 'file:///home/snoseeds/repos/decagon/projects/Leavaca/UI';
  const leavacaAPIsHost = 'http://localhost:3000';
  document.addEventListener('DOMContentLoaded', () => {
    const presentPageBody = document.querySelector('body');

    let userLocation = window.location.href.split('/');
    // eslint-disable-next-line prefer-destructuring
    userLocation = userLocation[userLocation.length - 1].split('.')[0];

    const setLocation = (location) => {
      window.location.href = location.includes('html')
        ? `${frontEndHost}/${location}`
        : `${frontEndHost}/${location}.html`;
    };

    // Function to show error message on signup and login
    const showError = (form, formSubmissionBtn, error, networkError) => {
      const elementToDisplayError = document.createElement('p');
      elementToDisplayError.classList.add('form-error');
      elementToDisplayError.textContent = error;
      form.appendChild(elementToDisplayError);

      const clearPreviousFormSubmixnError = () => {
        elementToDisplayError.textContent = '';
      };

      const showFormErrorAgain = previouslyWrongValue => function instantiateWithPrevWrongValue() {
        elementToDisplayError.textContent = this.value === previouslyWrongValue
          ? (formSubmissionBtn.setAttribute('disabled', 'disabled'),
          this.removeEventListener('keyup', clearPreviousFormSubmixnError, false),
          this.focus(), error)
          : (formSubmissionBtn.removeAttribute('disabled'), '');
      };

      if (networkError) {
        setTimeout(() => {
          elementToDisplayError.textContent = '';
        }, 10000);
      } else {
        const fieldToBeCorrected = form
          .querySelector(`input[id*='${error.split(' ')[0].toLowerCase()}']`) || form
          .querySelector(`input[id*=${error.match(new RegExp([...form.querySelectorAll('input')]
            .reduce((regexString, el) => regexString.concat(`(${el.getAttribute('id')})`),
              []).join('|'), 'g'))[0]}]`);
        if (fieldToBeCorrected) {
          fieldToBeCorrected.addEventListener('keyup', clearPreviousFormSubmixnError, false);
          fieldToBeCorrected.addEventListener('blur', showFormErrorAgain(fieldToBeCorrected.value), false);
          setTimeout(() => {
            fieldToBeCorrected.focus();
            fieldToBeCorrected.scrollIntoView();
          }, 4000);
        }
      }
    };

    // Function to change text content of an element
    const changeContent = (element, msg) => {
      element.textContent = msg;
    };

    const startIntegration = () => {
      // Inform of being logged out and guide to login if redirected away from desired page
      const informAndGuideToLogin = () => {
        const logOutMessage = document.querySelector('.main-header .log-out-message p');
        const loginForm = document.querySelector('#slideForm');
        logOutMessage.textContent = 'You\'ve been logged out';
        console.log(logOutMessage);
        const direction = document.createElement('p');
        loginForm.style.paddingTop = '15px';
        direction.style.marginBottom = '15px';
        direction.textContent = 'Login to continue to your destination';
        direction.classList.add('intro');
        loginForm.insertBefore(direction, loginForm.firstElementChild);
        console.log(localStorage.getItem('pageDesired'));
        loginForm.setAttribute('action', `${localStorage.getItem('pageDesired')}.html`
          + `${localStorage.getItem('userTypeQuery') ? '?'.concat(localStorage.getItem('userTypeQuery')) : ''}`);
        document.querySelector(`.${localStorage.getItem('userTypeQuery')
          || localStorage.getItem('userType')}-sign-in`).click();
      };

      if (presentPageBody.classList.contains('loginPage')
        && window.location.href.endsWith('?showLoginForm')) {
        informAndGuideToLogin();
      }

      const getRecordIfEmailExists = async (email) => {
        let recordOfGivenEmail;
        try {
          [recordOfGivenEmail] = await (await fetch(`${leavacaAPIsHost}/employee?email=${email}`)).json();
          console.log(recordOfGivenEmail);
        } catch (error) {
          console.log(error);
          throw error;
        }
        if (recordOfGivenEmail === undefined) return false;
        return recordOfGivenEmail;
      };

      const handleSubmittedSignUpForm = () => {
        const signupForm = document.querySelector('#signupForm');
        const employeeTypeByMgmtStatus = {
          0: 'employee',
          1: 'manager',
        };
        const managementCadreField = signupForm.querySelector('#managementStatus');
        signupForm.addEventListener('submit', async (e) => {
          e.preventDefault();
          const typeOfAcctToBeCreated = window.location.href.split('?')[1]
            || employeeTypeByMgmtStatus[managementCadreField.options[managementCadreField.selectedIndex].value];
          if (document.querySelector('.form-error')) {
            signupForm.removeChild(document.querySelector('.form-error'));
          }
          const signupBtn = document.querySelector('#signupBtn');
          const originalSignUpBtnText = signupBtn.textContent;
          changeContent(signupBtn, 'Loading...');
          const signUpFormPayloads = {
            firstName: document.querySelector('#firstName').value,
            lastName: document.querySelector('#lastName').value,
            email: document.querySelector('#email').value,
            password: document.querySelector('#password').value,
            employeeType: typeOfAcctToBeCreated,
          };
          signUpFormPayloads.token = signUpFormPayloads.email.split('@').join(signUpFormPayloads.employeeType);
          let isEmailUnique;
          try {
            isEmailUnique = await getRecordIfEmailExists(signUpFormPayloads.email);
          } catch (error) {
            changeContent(signupBtn, originalSignUpBtnText);
            showError(signupForm, signupBtn,
              'No internet connection or the server is presently down',
              true);
            return;
          }
          if (typeof isEmailUnique === 'object') {
              changeContent(signupBtn, originalSignUpBtnText);
              // if (typeOfAcctToBeCreated === 'admin') {
              //   changeContent(signupBtn, originalSignUpBtnText);
              //   showError(signupForm, signupBtn,
              //     'Only one IT Admin account is allowed at Leavaca',
              //     false);                
              // }
              showError(signupForm, signupBtn,
              'An Employee with the given email already exists',
              false);
              return;
          }

          const createNewEmployeeAPI = `${leavacaAPIsHost}/employee`;

          fetch(createNewEmployeeAPI, {
            method: 'POST',
            headers: {
              'Content-type': 'application/json',
              // authorization: `Bearer ${window.sessionStorage.token}`,
            },
            body: JSON.stringify(signUpFormPayloads),
          })
            .then(async (resp) => {
              if (resp.ok) {
                return resp.json();
              }
              const error = await resp.json();
              throw error;
            })
            .then((res) => {
              console.log('It is a success');
              if (typeOfAcctToBeCreated !== 'employee' && typeOfAcctToBeCreated !== 'manager') {
                Object.entries(res).forEach(([payload, value]) => {
                  window.sessionStorage[payload] = value;
                });
              }
              setLocation(signupForm.getAttribute('action'));
            })
            .catch((err) => {
              console.log(err);
              // console.log(err.body.error);
              changeContent(signupBtn, originalSignUpBtnText);
              showError(signupForm, signupBtn,
                err.error || 'No active internet connection or the server may be presently down',
                !err.error);
            });
        });
      };

      if (presentPageBody.classList.contains('createAcct')) {
        handleSubmittedSignUpForm();
      }

      const handleSubmittedSignInForm = () => {
        const signinForm = document.querySelector('#slideForm');
        signinForm.addEventListener('submit', async (e) => {
          e.preventDefault();
          if (localStorage.getItem('pageDesired')) localStorage.clear();
          if (signinForm.querySelector('.form-error')) {
            signinForm.removeChild(signinForm.querySelector('.form-error'));
          }
          const signinBtn = signinForm.querySelector('#slidingFormButton');
          const originalSignInBtnText = 'Sign In';
          changeContent(signinBtn, 'Loading...');
          const signInFormPayloads = {
            email: signinForm.querySelector('#email').value,
            password: signinForm.querySelector('#password').value,
          };
          let givenEmailRecordObj;
          try {
            givenEmailRecordObj = await getRecordIfEmailExists(signInFormPayloads.email);
            console.log(givenEmailRecordObj);
          } catch (error) {
            console.log('this error');
              changeContent(signinBtn, originalSignInBtnText);
              showError(signinForm, signinBtn,
                'No internet connection or the server is presently down',
                true);
            return;
          }
          if (givenEmailRecordObj === false) {
            changeContent(signinBtn, originalSignInBtnText);
            showError(signinForm, signinBtn,
              'There\'s no registered employee with this email on Leavaca',
              false);
            return;
          }
          const checkIfPasswordIsCorrect = () => signInFormPayloads.password === givenEmailRecordObj.password;
          if (checkIfPasswordIsCorrect()) {
            console.log(givenEmailRecordObj);
            Object.entries(givenEmailRecordObj).forEach(([payload, value]) => {
              window.sessionStorage[payload] = value;
            });
            setLocation(signinForm.getAttribute('action'));
          } else {
            console.log('Hey')
            changeContent(signinBtn, originalSignInBtnText);
            showError(signinForm, signinBtn, 'The supplied password is wrong', false);            
          }
        });
      };

      if (presentPageBody.classList.contains('loginPage')) {
        handleSubmittedSignInForm();
      }

      const render = () => {
        const memoizeUserType = () => {
          localStorage.setItem('userTypeQuery', window.sessionStorage.employeeType);
        };

        const logAnyUserTypeOut = () => {
          const logOut = document.querySelector('.log-out a');
          logOut.addEventListener('click', () => {
            const confirmationBox = document.querySelector('section.confirmation');
            const approveLogOut = confirmationBox.querySelector('div a:first-child');
            const declineLogOut = confirmationBox.querySelector('div a:last-child');
            const configureBoxForLogout = () => {
              memoizeUserType();
              window.sessionStorage.clear();
            };
            approveLogOut.addEventListener('click', configureBoxForLogout);
            declineLogOut.addEventListener('click',
              () => approveLogOut.removeEventListener('click', configureBoxForLogout));
          });
        };

        logAnyUserTypeOut();

        // Protect route and memoize the desired route if redirected to login
        const memoizeAndAuthenticate = (pageDesired) => {
          const token = window.sessionStorage.token;
          if (!token) {
            const logOut = document.querySelector('.log-out a');
            logOut.dataset.url += '?showLoginForm';
            // localStorage.setItem('userType', userLocation.split('_')[0]);
            // localStorage.setItem('userType', userLocation.split('_')[0]);
            // To get to know if userType is rootAdmin
            memoizeUserType();
            localStorage.setItem('pageDesired', pageDesired);
            setLocation(logOut.dataset.url);
          }
        };

        memoizeAndAuthenticate(userLocation);

      if (presentPageBody.classList.contains('protected')
        // The page 'create_any_admin_acct.html?rootAdmin' may or
        // may not be protected as decided by a rootAdmin that is directly registering
        // an accounty for himself
        && (userLocation !== 'create_any_acct'
          || window.location.href.includes('rootAdmin') === false)) {
        render();
      }
    };

    startIntegration();
  });
};

start();

const start = () => {
  const frontEndHost = window.location.href.includes('http')
    ? 'https://snoseeds.github.io/Leavaca/UI'
    : 'file:///home/snoseeds/repos/codesmith/Leavaca/UI/';
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
            leaveDays: document.querySelector('#leaveDays').value,
            remainingLeaveDays: document.querySelector('#leaveDays').value,
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
              window.sessionStorage.clear();
              //temporarily
              localStorage.clear();
              memoizeUserType();
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

        const mindLeaveDays = () => {
          document.querySelector('.remaining-days-reminder').textContent = `
          Mind that the remaining number of leave days available for you is ${window
            .sessionStorage.remainingLeaveDays} official days`;
        };

        const populateEmployeeType = (selectElementQuery, table, arrOfQueryNamesAndValues, employeeType) => {
          const employeeTypeSelectElement = document.querySelector(`${selectElementQuery}`);
          fetch(`${leavacaAPIsHost}/${table}?${arrOfQueryNamesAndValues.join('&')}`)
            .then(async (resp) => {
              if (resp.ok) {
                const parsedResponse = await resp.json();
                console.log(parsedResponse);
                if (parsedResponse.length > 0) {
                  parsedResponse.forEach((employeeTypeRecdObj) => {
                  employeeTypeSelectElement.innerHTML += `
                    <option value="${employeeTypeRecdObj.requesterEmail ||  employeeTypeRecdObj.email}" name="${employeeTypeRecdObj.requesterName || employeeTypeRecdObj.firstName.concat(' ').concat(employeeTypeRecdObj.lastName)}">
                      ${employeeTypeRecdObj.requesterName || employeeTypeRecdObj.firstName.concat(' ').concat(employeeTypeRecdObj.lastName)}
                    </option>`
                  })
                } else {
                  employeeTypeSelectElement.innerHTML += `
                    <option value="0">
                      No ${employeeType}s yet
                    </option>`
                }
              } else {
                employeeTypeSelectElement.innerHTML += `
                  <option value="0">
                    Error getting ${employeeType}s
                  </option>`
              }
            })
            .catch((error) => {
              console.log(error);
              employeeTypeSelectElement.innerHTML += `
                <option value="0">
                  Error getting ${employeeType}s
                </option>`                
            })
        };

        const validateAndGetOfficialDays = () => {
          const leaveCreationForm = document.querySelector('#leaveCreationForm') || document.querySelector('#leaveEditionForm');
          const leaveForm = {
            dateFrom: leaveCreationForm.querySelector('#dateStart'),
            dateTo: leaveCreationForm.querySelector('#dateEnd'),
            noOfWorkingDays: leaveCreationForm.querySelector('#noOfWorkingDays'),
          };

          const nDay = [];
          let i = 0;

          const verify = isField => {
            const [y, m, d] = isField.value.split('-');
            const refDate = new Date(isField.value) // for 'yyyy-mm-dd'

            if (m < 1 || m > 12 || refDate.getDate() != d || y.length != 4 || (!/^20/.test(y))){return false}
            nDay[i++] = refDate.getDay();
            return refDate; 
          };

          const countDays = isForm => {
            const endDay = new Date(isForm.dateTo.value).getDay();
            console.log('alright');
            let isValid = true;
            let startDate = verify(isForm.dateFrom);
            if (isValid) {
              endDate = verify(isForm.dateTo);
            } else {
              endDate = false;
            }
            if (startDate && endDate) {
              const daysApart = Math.round(((endDate-startDate)/86400000));
              if (nDay[0] == 0 || nDay[0] == 6) {
                isValid = false;
                startDate = false;
              }
              if (endDay == 0 || endDay == 6) {
                isValid = false;
                endDate = false;
              }

              if (daysApart <= 0) {
                isValid = false;
                endDate = false;
              }
              if (isValid) {
                workDays = daysApart - (parseInt(daysApart / 7) * 2);
                if (daysApart < 7 && nDay[1] != 0 && nDay[0]-nDay[1] >= 1) workDays = workDays-2;
                if (daysApart < 7 && nDay[1] == 0) workDays--;
                isForm.noOfWorkingDays.value = workDays + 1;
                i = 0;
              }
            }
            if (!startDate) {
              alert('Invalid Start Date: Leave Start Date must be a weekday and must be earlier than End Date.')
              isForm.dateFrom.value = "";
              isForm.dateFrom.focus();
              i = 0;
            } else if (!endDate) {
              alert('Invalid End Date. Leave End Date must be a weekday and must be later than Start Date.')
              isForm.dateTo.value = "";
              isForm.dateTo.focus();
              i = 0;
            }
          };
          leaveForm.dateFrom.addEventListener('change', () => {
            if (leaveForm.dateTo.value) countDays(leaveForm);
            console.log('yes');
            console.log('leaveForm.dateTo.value');
          });
          leaveForm.dateTo.addEventListener('change', () => countDays(leaveForm));
        };

        const handleLeaveCreationForm = () => {
          mindLeaveDays();
          const leaveCreationForm = document.querySelector('#leaveCreationForm');
          populateEmployeeType('#reviewManager', 'employee', ['employeeType=manager'], 'manager');
          validateAndGetOfficialDays();
          const createLeaveRequestBtn = leaveCreationForm.querySelector('#createLeaveRequestBtn');
          const reviewManager = leaveCreationForm.querySelector('#reviewManager');
          leaveCreationForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            if (document.querySelector('.form-error')) {
              leaveCreationForm.removeChild(document.querySelector('.form-error'));
            }
            const originalCreateLeaveBtnText = createLeaveRequestBtn.textContent;
            changeContent(createLeaveRequestBtn, 'Loading...');
            const reviewManagerObject = {
              name: reviewManager.options[reviewManager.selectedIndex].getAttribute('name'),
              email: reviewManager.options[reviewManager.selectedIndex].value,
              comment: 'No comments yet',
            };
            let [ notOfInterest, ...interestedDateInfo ] = new Date().toDateString().split(' ');
            interestedDateInfo = interestedDateInfo.join(' ');
            const leaveRequestFormPayloads = {
              requesterName: `${window.sessionStorage.firstName} ${window.sessionStorage.lastName}`,
              requesterEmail: window.sessionStorage.email,
              requesterComment: leaveCreationForm.querySelector('#requesterComment').value,
              createdDate: interestedDateInfo,
              editedDate: interestedDateInfo,
              startDate: leaveCreationForm.querySelector('#dateStart').value,
              endDate: leaveCreationForm.querySelector('#dateEnd').value,
              noOfWorkingDays: leaveCreationForm.querySelector('#noOfWorkingDays').value,
              status: 'pending',
              reviewManagerObject,
            };
            const createNewLeaveReqAPI = `${leavacaAPIsHost}/leave`;
            fetch(createNewLeaveReqAPI, {
              method: 'POST',
              headers: {
                'Content-type': 'application/json',
              },
              body: JSON.stringify(leaveRequestFormPayloads),
            })
              .then(async (resp) => {
                if (resp.ok) {
                  return resp.json();
                }
                const error = await resp.json();
                throw error;
              })
              .then((res) => {
                setLocation(leaveCreationForm.getAttribute('action'));
              })
              .catch((err) => {
                console.log(err);
                // console.log(err.body.error);
                changeContent(createLeaveRequestBtn, originalCreateLeaveBtnText);
                showError(leaveCreationForm, createLeaveRequestBtn,
                  err.error || 'No active internet connection or the server may be presently down',
                  !err.error);
              });
          });        
        }

        if (presentPageBody.classList.contains('leave-request-creation')) {
          handleLeaveCreationForm();
        }

        const handleLeaveEditionForm = async () => {
          mindLeaveDays();
          const editionFormFieldset = document.querySelector('#leaveEditionForm fieldset');
          const showLeaveEditionError = () => {
            const mainEditionSection = document.querySelector('.edit-leave-form');
            mainEditionSection.innerHTML = `
              <p>Oops, there's an error getting the editable contents of the selected leave request</p>
              <p>Kindly try again later or refresh the page</p>`;
          };
          // let formerLeaveRequestObj;
          let formerManagerObj;
          await fetch(`${leavacaAPIsHost}/leave?id=${window.sessionStorage.selectedLeaveId}`)
            .then(async (resp) => {
              if (resp.ok) {
                const [leaveRequestObject] = await resp.json();
                // formerLeaveRequestObj = { ...leaveRequestObject };
                formerManagerObj = { ...leaveRequestObject.reviewManagerObject };
                if (leaveRequestObject.status !== 'pending') {
                  const mainEditionSection = document.querySelector('.edit-leave-form');
                  mainEditionSection.innerHTML = `
                    <p>Oops, you can no longer edit this leave request because it has been reviewed</p>
                    <p>You can create a new leave request to meet your intention for edition</p>`;
                } else {
                  editionFormFieldset.innerHTML = `
                    <label>
                      Comments (optional)
                      <input class="optional" type="text" id="requesterComment" maxlength="150"
                      value="${leaveRequestObject.requesterComment}">
                    </label>

                    <label class="control-label">
                      Assign Review Manager
                      <select data-val-type="reviewManagerType" id="reviewManager" class="form-control">
                        <option value="0">-- Assign Review Manager --</option>
                        <option value=${leaveRequestObject.reviewManagerObject.email} name="${leaveRequestObject.reviewManagerObject.name}" selected>
                          ${leaveRequestObject.reviewManagerObject.name}
                        </option>
                      </select>
                    </label>

                    <label class="control-label">Start date
                      <input type="date" id="dateStart" class="optional form-control" value=${leaveRequestObject.startDate} required pattern="[0-9]{2}-[0-9]{4}-[0-9]{2}">
                    </label>

                    <label class="control-label">End date
                      <input type="date" id="dateEnd" class="optional form-control" value=${leaveRequestObject.endDate} required pattern="[0-9]{2}-[0-9]{4}-[0-9]{2}">
                    </label>

                    <label class="control-label">Calculated Working Days
                      <input disabled type="number" id="noOfWorkingDays" class="optional form-control" required value=${leaveRequestObject.noOfWorkingDays}>
                    </label>`; 
                }
              } else {
                showLeaveEditionError();
              }
            })
            .catch((error) => {
              console.log(error);
              showLeaveEditionError();
            })
          populateEmployeeType('#reviewManager', 'employee', ['employeeType=manager'], 'manager');
          validateAndGetOfficialDays();
          const leaveEditionForm = document.querySelector('#leaveEditionForm');
          const editLeaveRequestBtn = leaveEditionForm.querySelector('#editLeaveRequestBtn');
          const reviewManager = leaveEditionForm.querySelector('#reviewManager');
          leaveEditionForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            if (document.querySelector('.form-error')) {
              leaveEditionForm.removeChild(document.querySelector('.form-error'));
            }
            const originalEditLeaveBtnText = editLeaveRequestBtn.textContent;
            changeContent(editLeaveRequestBtn, 'Updating...');
            const newReviewManagerObj = {
              name: reviewManager.options[reviewManager.selectedIndex].getAttribute('name'),
              email: reviewManager.options[reviewManager.selectedIndex].value,
              comment: 'No comments yet',
            };
            if (formerManagerObj.email === newReviewManagerObj.email) {
              newReviewManagerObj.comment = formerManagerObj.comment;
            }
            let [ notOfInterest, ...interestedDateInfo ] = new Date().toDateString().split(' ');
            interestedDateInfo = interestedDateInfo.join(' ');
            const leaveRequestFormPayloads = {
              requesterComment: leaveEditionForm.querySelector('#requesterComment').value,
              editedDate: interestedDateInfo,
              startDate: leaveEditionForm.querySelector('#dateStart').value,
              endDate: leaveEditionForm.querySelector('#dateEnd').value,
              noOfWorkingDays: leaveEditionForm.querySelector('#noOfWorkingDays').value,
              reviewManagerObject: newReviewManagerObj,
            };
            const updateLeaveRequestAPI = `${leavacaAPIsHost}/leave/${window.sessionStorage.selectedLeaveId}`;
            fetch(updateLeaveRequestAPI, {
              method: 'PATCH',
              headers: {
                'Content-type': 'application/json',
              },
              body: JSON.stringify(leaveRequestFormPayloads),
            })
              .then(async (resp) => {
                if (resp.ok) {
                  return resp.json();
                }
                const error = await resp.json();
                throw error;
              })
              .then((res) => {
                setLocation(leaveEditionForm.getAttribute('action'));
              })
              .catch((err) => {
                console.log(err);
                changeContent(editLeaveRequestBtn, originalEditLeaveBtnText);
                showError(leaveEditionForm, editLeaveRequestBtn,
                  err.error || 'No active internet connection or the server may be presently down',
                  !err.error);
              });
          });
        }

        if (presentPageBody.classList.contains('leave-request-edition')) {
          handleLeaveEditionForm();
        }

        const showDateToday = () => {
          const welcomeSection = document.querySelector('section.portal-intro');
            // const welcomeDetails = document.querySelector('header.portal-intro');
            welcomeSection.innerHTML = `
              <h4>Today's Date</h4>
              <p>${new Date().toDateString()}</p>`;
        };

        const handleRequestsClicks = (page) => {
          function setLeavePageQueryId () {
            window.sessionStorage.selectedLeaveId = this.textContent;
            if (window.sessionStorage.employeeType === 'employee') {
              setLocation('staff_leave_details');
            } else if (window.sessionStorage.employeeType === 'rootAdmin') {
              setLocation('admin_leave_details');
            } else {
              setLocation(page);
            }
          }
          const leaveRequestElements = document.querySelectorAll('.leave-id-no p');
          leaveRequestElements.forEach(leaveIdLinkElement => {
            console.log('ok');
            leaveIdLinkElement.addEventListener('click', setLeavePageQueryId);
          });
        };

        const renderLeaveReqsTable = (arrOfQueryNamesAndValues, tableCategory) => {
          const leaveRequestsTableBody = document.querySelector(`.leave-requests-table table.${tableCategory} tbody`)
            || document.querySelector('.leave-requests-table table tbody');
          const showLeaveReqsDisplayError = (errorInfo) => {
            const displaySection = document.querySelector(`table.${tableCategory} + .leave-request-creation`)
              || document.querySelector('.leave-request-creation');
            const p = document.createElement('p');
            p.style.color = 'red';
            p.textContent = errorInfo;
            displaySection.insertBefore(p, displaySection.firstElementChild);
          };
          fetch(`${leavacaAPIsHost}/leave?${arrOfQueryNamesAndValues.join('&')}`)
            .then(async (resp) => {
              if (resp.ok) {
                const parsedResponse = await resp.json();
                console.log(parsedResponse);
                if (parsedResponse.length > 0) {
                  parsedResponse.forEach((leaveRequestObject) => {
                  leaveRequestsTableBody.innerHTML += `
                    <tr class="accounts-table-row"
                      data-email="${leaveRequestObject.requesterEmail}"
                      data-leave-req-id="${leaveRequestObject.id}">
                      <td class="acct-name requester-name">
                        <p>${leaveRequestObject.requesterName}</p>
                      </td>
                      <td class="acct-number leave-id-no">
                        <p>${leaveRequestObject.id}</p>
                      </td>
                      <td class="account-type date-requested">
                        <p>${leaveRequestObject.createdDate}</p>
                      </td>
                      <td class="start-date">
                        <p>${leaveRequestObject.startDate}</p>
                      </td>
                      <td class="end-date">
                        <p>${leaveRequestObject.endDate}</p>
                      </td>
                      <td class="available-balance no-of-leave-official-days">
                        <p>${leaveRequestObject.noOfWorkingDays}</p>
                      </td>
                    </tr>`;
                    if (presentPageBody.classList.contains('leave-details')) {
                      leaveRequestsTableBody.innerHTML += `
                        <tr class="accounts-table-row">
                          <td>
                            Requester Comments
                          </td>
                          <td colspan="5">
                            ${leaveRequestObject.requesterComment}
                          </td>
                        </tr>
                        <tr class="accounts-table-row">
                          <td>
                            Manager
                          </td>
                          <td colspan="2">
                            ${leaveRequestObject.reviewManagerObject.name}
                          </td>
                          <td>
                          </td>
                          <td>
                            Status
                          </td>
                          <td id="status">
                            ${leaveRequestObject.status}
                          </td>
                        </tr>
                        <tr class="accounts-table-row">
                          <td>
                            Review Comments
                          </td>
                          <td colspan="5">
                            ${leaveRequestObject.reviewManagerObject.comment}
                          </td>
                        </tr>`;
                    }
                  });
                  setTimeout(handleRequestsClicks.bind(null, 'leave_details'), 0);
                } else {
                  showLeaveReqsDisplayError('You do not have any leave request');
                }
                if ((presentPageBody.classList.contains('leave-details') !== false && (window.sessionStorage.employeeType === 'manager'
                  && localStorage.getItem('remainingLeaveDays') === null))
                  || presentPageBody.classList.contains('manager-portal')
                  || presentPageBody.classList.contains('admin-eagle-view-portal')) {
                  leaveRequestsTableBody.innerHTML += `
                    <td colspan="6">
                      <a id="#top" class="">Back to Top&#x25B2;</a>
                    </td>`;
                } else {
                  leaveRequestsTableBody.innerHTML += `
                    <tr class="requests-total accounts-table-row total">
                      <td>
                        Annual Leave Days
                      </td>
                      <td>
                        ${localStorage.getItem('leaveDays') || window.sessionStorage.leaveDays}
                      </td>
                      <td>
                      </td>
                      <td colspan="2">
                        Remaining Leave Days
                      </td>
                      <td>
                        ${localStorage.getItem('remainingLeaveDays') || window.sessionStorage.remainingLeaveDays}
                      </td>
                    </tr>`;
                }
              } else {
                showLeaveReqsDisplayError('Ooops, there\'s an error getting leave requests, Kindly reload the page!');
              }
            })
            .catch(err => console.log(err));
        };

        const renderEmployeeDashboard = async () => {
          showDateToday();
          if (window.sessionStorage.employeeType === 'manager') {
            document.querySelector('#managerPortal').classList.remove('hide');
          }
          if (window.location.href.includes('deleteSelectedReq')) {
            const deleteLeaveRequestAPI = `${leavacaAPIsHost}/leave/${window.sessionStorage.selectedLeaveId}`;
            await fetch(deleteLeaveRequestAPI, {
              method: 'DELETE',
              headers: {
                'Content-type': 'application/json',
              }
            })
              .then(async (resp) => {
                if (resp.ok) {
                  document.querySelector('header.portal-intro').innerHTML = `
                    <p>Successfully deleted leave request with id: ${window.sessionStorage.selectedLeaveId}
                    Kindly see your remaining leave requests below if any</p>`;
                } else {
                  const error = await resp.json();
                  throw error;
                }
              })
              .catch((err) => {
                console.log(err);
                document.querySelector('header.portal-intro').innerHTML = `
                  <p>There is an error deleting the leave request with id: ${window.sessionStorage.selectedLeaveId}.
                  Kindly try again later</p>`;
              });
          }
          renderLeaveReqsTable([`requesterEmail=${window.sessionStorage.email}`]);
        };


        const browseEmployeesAndLeave = (leaveCatergoryInUpperScope, selectElementIdInUpperScope) => {
          const configuredCategory = () => {
            const leaveCategory = leaveCatergoryInUpperScope;
            const selectElementId = selectElementIdInUpperScope;
            const takeLeaveRequestToTop = (leaveRequestRow) => {
              const tableBodyOfAllEmployeesLeave = document.querySelector(`.leave-requests-table table.${leaveCategory} tbody`);
              tableBodyOfAllEmployeesLeave.prepend(tableBodyOfAllEmployeesLeave.removeChild(leaveRequestRow));
            };
            function moveSelEmpLeavesToTop() {
              const selectedEmployeeLeaves = document.querySelectorAll(`table.${leaveCategory} tr[data-email='${this
                .options[this.selectedIndex].value}']`);
              if (selectedEmployeeLeaves) {
                selectedEmployeeLeaves.forEach((leaveRequest, i) => {
                  takeLeaveRequestToTop(selectedEmployeeLeaves[i]);
                });
              }
            }
            function moveInputtedLeaveIdToTop() {
              const inputtedLeaveId = document.querySelector(`table.${leaveCategory} tr[data-leave-req-id^='${this.value}']`);
              takeLeaveRequestToTop(inputtedLeaveId);
            }
            const searchEmployeesNamesByEmail = () => {
              const emailInput = document.querySelector(`form.${leaveCategory} #email`);
              function setMatchedOptionToSelected() {
                const matchedOption = document.querySelector(`form.${leaveCategory} option[value^='${this.value}']`);
                matchedOption.selected = 'selected';
                moveSelEmpLeavesToTop.call(document.querySelector(`form.${leaveCategory} #${selectElementId}`));
              }
              emailInput.addEventListener('keyup', setMatchedOptionToSelected);
            };
            const searchLeaveReqsBySelectedEmp = () => {
              const selectEmployee = document.querySelector(`form.${leaveCategory} #${selectElementId}`);
              selectEmployee.addEventListener('change', moveSelEmpLeavesToTop);
            };
            const searchLeaveReqsByLeaveId = () => {
              const leaveIdInput = document.querySelector(`form.${leaveCategory} #leaveId`);
              leaveIdInput.addEventListener('keyup', moveInputtedLeaveIdToTop);
            };
            searchEmployeesNamesByEmail();
            searchLeaveReqsBySelectedEmp();
            searchLeaveReqsByLeaveId();
          }
          return configuredCategory;
        };

        const showTotals = (arrOfTotalsQuery) => {
          const collectionOfTotalsNode = document.querySelectorAll('.total');
          arrOfTotalsQuery.forEach((totalId, i) => {
            let length = document.querySelectorAll(`#${totalId} option`).length;
            if (length === 2) {
              if (/([A-z0-9.-_]+)@([A-z]+)\.([A-z]){2,5}$/.test(document.querySelectorAll(`#${totalId} option`)[1].value)) {
                collectionOfTotalsNode[i].textContent = length - 1;
              } else {
                collectionOfTotalsNode[i].textContent = length - 2;
              }
            } else {
              collectionOfTotalsNode[i].textContent = length - 1;
            }
          })
        };

        const renderManagerDashboard = () => {
          showDateToday();
          populateEmployeeType('form.pending #employeesThatChoseManager', 'leave', [`reviewManagerObject.email=${window.sessionStorage.email}`, 'status=pending'], 'employee');
          renderLeaveReqsTable([`reviewManagerObject.email=${window.sessionStorage.email}`, 'status=pending'], 'pending');
          const configureSearchForPendingLeave = browseEmployeesAndLeave('pending', 'employeesThatChoseManager');
          configureSearchForPendingLeave();
          populateEmployeeType('form.approved #employeesThatChoseManager', 'leave', [`reviewManagerObject.email=${window.sessionStorage.email}`, 'status=approved'], 'employee');
          renderLeaveReqsTable([`reviewManagerObject.email=${window.sessionStorage.email}`, 'status=approved'], 'approved');
          const configureSearchForApprovedLeave = browseEmployeesAndLeave('approved', 'employeesThatChoseManager');
          configureSearchForApprovedLeave();
          populateEmployeeType('form.disapproved #employeesThatChoseManager', 'leave', [`reviewManagerObject.email=${window.sessionStorage.email}`, 'status=disapproved'], 'employee');
          renderLeaveReqsTable([`reviewManagerObject.email=${window.sessionStorage.email}`, 'status=disapproved'], 'disapproved');
          const configureSearchForDisapprovedLeave = browseEmployeesAndLeave('disapproved', 'employeesThatChoseManager');
          configureSearchForDisapprovedLeave();
          setTimeout(showTotals.bind(null, ['pending', 'approved', 'disapproved']), 0);
        };

        if (presentPageBody.classList.contains('manager-portal')) {
          renderManagerDashboard();
        }

        const renderAdminEagleView = () => {
          showDateToday();
          const searchEmployeesNamesByEmail = (listCategory) => {
            const emailInput = document.querySelector(`form.${listCategory} #email`);
            function setMatchedOptionToSelected() {
              const matchedOption = document.querySelector(`form.${listCategory} option[value^='${this.value}']`);
              matchedOption.selected = 'selected';
            }
            emailInput.addEventListener('keyup', setMatchedOptionToSelected);
          };
          searchEmployeesNamesByEmail('all-added-users');
          populateEmployeeType('#all-added-users', 'employee', ['1=1'], 'employee');
          populateEmployeeType('form.pending #pending', 'leave', ['status=pending'], 'employee');
          renderLeaveReqsTable(['status=pending'], 'pending');
          const configureSearchForPendingLeave = browseEmployeesAndLeave('pending', 'pending');
          configureSearchForPendingLeave();
          populateEmployeeType('form.approved #approved', 'leave', ['status=approved'], 'employee');
          renderLeaveReqsTable(['status=approved'], 'approved');
          const configureSearchForApprovedLeave = browseEmployeesAndLeave('approved', 'approved');
          configureSearchForApprovedLeave();
          populateEmployeeType('form.disapproved #disapproved', 'leave', ['status=disapproved'], 'employee');
          renderLeaveReqsTable(['status=disapproved'], 'disapproved');
          const configureSearchForDisapprovedLeave = browseEmployeesAndLeave('disapproved', 'disapproved');
          configureSearchForDisapprovedLeave();
          setTimeout(showTotals.bind(null, ['all-added-users', 'pending', 'approved', 'disapproved']), 5000);
        };

        if (presentPageBody.classList.contains('admin-eagle-view-portal')) {
          renderAdminEagleView();
        }

        if (presentPageBody.classList.contains('staff-portal')) {
          renderEmployeeDashboard();
        }

        const renderLeaveDetailsPage = async () => {
          showDateToday();
          const show = (element) => element.classList.remove('hide');
          const editLeaveRequestBtn = document.querySelector('#edit');
          const deleteLeaveRequestBtn = document.querySelector('#delete');
          const approveLeaveRequestBtn = document.querySelector('#approve');
          const disapproveLeaveRequestBtn = document.querySelector('#disapprove');
          const leaveReviewComment = document.querySelector('.leave-review-comment');
          if (window.sessionStorage.employeeType === 'manager') {
            show(approveLeaveRequestBtn);
            show(disapproveLeaveRequestBtn);
            show(leaveReviewComment);
            const statusElement = document.querySelector('#status');
            const jobResultDisplaySection = document.querySelector('.request-info');
            if (window.location.href.includes('disapproved')) {
              const disapproveLeaveRequestAPI = `${leavacaAPIsHost}/leave/${window.sessionStorage.selectedLeaveId}`;
              const leaveRequestObj = await (await fetch(disapproveLeaveRequestAPI)).json();
              const { requesterEmail } = leaveRequestObj;
              const getRequesterDetailsAPI = `${leavacaAPIsHost}/employee/?email=${requesterEmail}`;
              const [requesterDetailsObj] = await (await fetch(getRequesterDetailsAPI)).json();
              const { remainingLeaveDays, leaveDays } = requesterDetailsObj;
              await fetch(disapproveLeaveRequestAPI, {
                  method: 'PATCH',
                  headers: {
                    'Content-type': 'application/json',
                  },
                  body: JSON.stringify({status: 'disapproved'}),
                })
                .then(async (resp) => {
                  if (resp.ok) {
                    localStorage.setItem('remainingLeaveDays', remainingLeaveDays);
                    localStorage.setItem('leaveDays', leaveDays);
                    jobResultDisplaySection.innerHTML = `
                      <p>Kindly see details of the disapproved leave request below and requester's remaining leave days</p>`;
                  } else {
                    const error = await resp.json();
                    throw error;                      
                  }
                })
                .catch((err) => {
                  console.log(err);
                  jobResultDisplaySection.innerHTML = `
                    <p>There is an error while disapproving this leave request.
                    Kindly try again later</p>`;
                });
            } else if (window.location.href.includes('approved')) {
              const approveLeaveRequestAPI = `${leavacaAPIsHost}/leave/${window.sessionStorage.selectedLeaveId}`;
              const leaveRequestObj = await (await fetch(approveLeaveRequestAPI)).json();
              const { requesterEmail, noOfWorkingDays } = leaveRequestObj;
              const getRequesterDetailsAPI = `${leavacaAPIsHost}/employee/?email=${requesterEmail}`;
              const [requesterDetailsObj] = await (await fetch(getRequesterDetailsAPI)).json();
              const { remainingLeaveDays, leaveDays, id } = requesterDetailsObj;
              const updateEmployeeAPI = `${leavacaAPIsHost}/employee/${id}`;
              if (remainingLeaveDays - noOfWorkingDays >= 0) {
                await Promise.all([
                  fetch(approveLeaveRequestAPI, {
                    method: 'PATCH',
                    headers: {
                      'Content-type': 'application/json',
                    },
                    body: JSON.stringify({status: 'approved'}),
                  }),
                  fetch(updateEmployeeAPI, {
                    method: 'PATCH',
                    headers: {
                      'Content-type': 'application/json',
                    },
                    body: JSON.stringify({remainingLeaveDays: remainingLeaveDays - noOfWorkingDays}),
                  })])
                  .then(async ([resp1, resp2]) => {
                    if (resp1.ok && resp2.ok) {
                      localStorage.setItem('remainingLeaveDays', remainingLeaveDays - noOfWorkingDays);
                      localStorage.setItem('leaveDays', leaveDays);
                      jobResultDisplaySection.innerHTML = `
                        <p>Kindly see details of the approved leave request below and requester's remaining leave days</p>`;
                    } else if (!resp1.ok) {
                      const error = await resp1.json();
                      throw error;
                    } else {
                      const error = await resp2.json();
                      throw error;                      
                    }
                  })
                  .catch((err) => {
                    console.log(err);
                    jobResultDisplaySection.innerHTML = `
                      <p>There is an error while approving this leave request.
                      Kindly try again later</p>`;
                  });
              } else {
                jobResultDisplaySection.innerHTML = `
                  <p>The leave request can't be approved because it has more working days than remaining leave details for the employee</p>`;                
              }
            }
            if (window.location.href.includes('commented')) {
              document.querySelector('.request-info p')
                .textContent = 'Kindly see details of the commented leave request below';
            }
          } else {
            show(editLeaveRequestBtn);
            show(deleteLeaveRequestBtn);
          }
          if (window.location.href.includes('updated')) {
            document.querySelector('.request-info p')
              .textContent = 'Kindly see details of the updated leave request below';
          }
          renderLeaveReqsTable([`id=${window.sessionStorage.selectedLeaveId}`]);
          if (window.sessionStorage.employeeType === 'manager') {
            const statusElement = document.querySelector('#status');
            setTimeout(() => {
              if (statusElement.textContent === 'approved') {
                approveLeaveRequestBtn.setAttribute('disabled', 'disabled');
                if (new Date(document.querySelector('.start-date')
                    .textContent.replace(/\s+/g, '')) - new Date()) {
                  disapproveLeaveRequestBtn.setAttribute('disabled', 'disabled')
                }
              }
            }, 0);
          }
        };  

        if (presentPageBody.classList.contains('leave-details')) {
          renderLeaveDetailsPage();
        }
      
      }

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

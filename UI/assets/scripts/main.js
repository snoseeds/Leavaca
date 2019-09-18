const startApp = () => {
  document.addEventListener('DOMContentLoaded', () => {
    const presentPageBody = document.querySelector('body');

    const logOutMessage = () => {
      const logOut = document.querySelector('.log-out-message');
      logOut.style.display = window.location.href.includes('?log_out') ? 'block' : 'none';
    };

    if (presentPageBody.classList.contains('loginPage')) {
      logOutMessage();
    }

    const validateFormFields = () => {
      const validValuesObj = {
        text: {
          expected: () => /^[A-z]{2,20}$/,
          failureResponse: 'must be two letters at least and must not contain digits',
        },
        number: {
          expected: () => /^[0-9]{11}$/,
          failureResponse: 'must contain eleven digits as a Nigerian phone number',
        },
        email: {
          expected: () => /([A-z0-9.-_]+)@([A-z]+)\.([A-z]){2,5}$/,
          failureResponse: 'is invalid',
        },
        password: {
          expected: () => /[a-zA-Z0-9\w!@#$%^&*()_+|]{8,20}$/,
          failureResponse: 'must be eight characters at least',
        },
        confirmPassword: {
          expected: () => new RegExp(`^${document.querySelector('#password').value}$`),
          failureResponse: 'must be equal to password',
        },
        transactionAmount: {
          expected: () => /^[1-9]+\d*$/,
          failureResponse: 'must be a positive whole number greater than zero',
        },
        idCardType: {
          expected: () => /^[1-8]$/,
          failureResponse: 'must be a valid identification card type',
        },
        acctType: {
          expected: () => /^(savings)|(current)$/,
          failureResponse: 'must be either savings or current',
        },
        libraryValidation: {
          expected: () => /^.{8,100}$/,
          failureResponse: 'must have minimum of eight characters',
        },
      };
      const formSubmitBtn = document.querySelector('.formActionBtn');

      function validate() {
        const valTypeStore = validValuesObj[this.dataset.valType || this.type];
        if (valTypeStore.expected().test(
          (this.options ? this.options[this.selectedIndex].value : undefined) || this.value
        )) {
          this.parentNode.previousElementSibling.textContent = '';
          formSubmitBtn.removeAttribute('disabled');
        } else {
          this.parentNode.previousElementSibling.textContent = `${this.parentNode.firstChild
            .textContent.match(/([\w]+\s?\b){1,}/)[0]} ${valTypeStore.failureResponse}`;
          formSubmitBtn.setAttribute('disabled', 'disabled');
        }
      }

      // const fieldsToBeValidated = document.querySelectorAll('.create-account label input');
      const fieldsToBeValidated = document.querySelectorAll('input:not([type="month"]), select');
      fieldsToBeValidated.forEach((element) => {
        const elementToDisplayError = document.createElement('p');
        elementToDisplayError.classList.add('error');
        element.parentNode.parentNode.insertBefore(elementToDisplayError, element.parentNode);
        element.addEventListener('keyup', validate, false);
        element.addEventListener('change', validate, false);
      });
    };

    if (presentPageBody.classList.contains('createAcct')
      || presentPageBody.classList.contains('slidingFormPage')
      || presentPageBody.classList.contains('create-bank-acct')) {
      validateFormFields();
    }

    // Section to Toggle Menu on Mobile Screen
    const mobileMenuToggle = (formStatus) => {
      // toggleMenu on mobile
      const menu = document.querySelector('#menuB');
      const mainBody = document.querySelector('#main');
      // Multiple definitions for sideBar because of different type of
      // sidebars that are to be used for create admin page
      const sideBar = window.location.href.includes('root') &&
                      document.querySelector('#pageSideBar') ?
                      document.querySelector('#pageSideBar') :
                      document.querySelector('#portalSideBar') ? 
                      document.querySelector('#portalSideBar') :
                      document.querySelector('#side');

      const nav = sideBar.firstElementChild;

      // Toggle Menu on Forms Login Forms Display
      const overlayForForm = document.querySelector('#transOverlay');
      const formSliding = document.querySelector('#formSliding');

      const style = document.createElement('style');
      document.head.appendChild(style);

      const showMenu = () => {
        const mainBodyStyles = window.getComputedStyle(mainBody);
        // To get tentative width of sideBar (70vw),
        // which has been given to nav as well
        const sideBarStyles = window.getComputedStyle(nav);
        const mainBodyHeight = mainBodyStyles.getPropertyValue('height');
        const mainBodyWidth = mainBodyStyles.getPropertyValue('width').slice(0, -2);
        const sideBarWidth = sideBarStyles.getPropertyValue('width').slice(0, -2);
        style.textContent = `@media only screen and (max-width: 400px) {
          aside.main-sidebar {
            height: ${mainBodyHeight};
          }
          .show-menu {
            -webkit-box-shadow: ${mainBodyWidth - sideBarWidth}px 0px 0px 0px rgba(0,0,0,0.46);
               -moz-box-shadow: ${mainBodyWidth - sideBarWidth}px 0px 0px 0px rgba(0,0,0,0.46);
                    box-shadow: ${mainBodyWidth - sideBarWidth}px 0px 0px 0px rgba(0,0,0,0.46);   
          }     
        }`;
        sideBar.classList.add('show-menu');

        const hideMenu = () => {
          sideBar.classList.remove('show-menu');
          mainBody.removeEventListener('click', hideMenu, false);
          if (formStatus) {
            overlayForForm.removeEventListener('click', hideMenu, false);
            formSliding.removeEventListener('click', hideMenu, false);
            overlayForForm.removeAttribute('onclick');
            overlayForForm.style.zIndex = '2';
          }
        };
        mainBody.addEventListener('click', hideMenu, false);
        if (formStatus) {
          overlayForForm.style.zIndex = '3';
          overlayForForm.setAttribute('onclick', 'event.stopPropagation()');
          overlayForForm.addEventListener('click', hideMenu, false);
          formSliding.addEventListener('click', hideMenu, false);
        }
      };
      menu.addEventListener('click', showMenu, false);
    };

    mobileMenuToggle();

    // Section to Toggle Sliding Form or Login Form on Sign-in Pages and Transact Page
    const slidingFormToggle = () => {
      // Show Login form on clicking SignIn Button, and Hide it on clicking body
      const mainBody = document.querySelector('#main');
      const slideContainer = document.querySelector('#slideContainer');
      // const signInBtn = document.querySelector('#signInBtn');
      const transOverlay = document.querySelector('#transOverlay');
      const slide = document.querySelector('#slide');
      const slideForm = document.querySelector('#slideForm');

      function showForm(formSubmitLink) {
        const submitForm = document.querySelector('#slideForm');
        const submitBtn = document.querySelector('#slidingFormButton');
        // const slidingFormButton = document.querySelector('#slidingFormButton');

        if (presentPageBody.classList.contains('transaction')) {
          const configTransactionForm = () => {
            const transactLabel = document.querySelector('#formLabel p');
            const selectUserAcctNo = document.querySelector('#selectAcctNoOfUser');
            const amountInputField = document.querySelector('#transactField');

            const transactBoxForm = () => {
              transactLabel.textContent = `${this.textContent}`;
              amountInputField.value = '';
              amountInputField.setAttribute('placeholder', `${this.dataset.transactAction}`);
              amountInputField.setAttribute('name', `${this.dataset.name}`);
              submitBtn.textContent = `${this.textContent}`;
              const transactType = `${this.dataset.transactType}`;
              console.log(selectUserAcctNo);
              const selectedUserAcctNo = selectUserAcctNo.options[selectUserAcctNo.selectedIndex].value;
              const doTransaction = () => {
                const inputAmount = amountInputField.value;
                console.log(inputAmount);
                const transactLink = `${transactType}_${selectedUserAcctNo}_with_${inputAmount}`;
                submitForm.setAttribute('action', `${transactLink}`);
                amountInputField.value = '';
              };
              submitBtn.addEventListener('click', doTransaction, false);
            };
            transactBoxForm();
          };
          configTransactionForm();
        } else {
          submitForm.setAttribute('action', !window.location.href.includes('?showLoginForm')
            ? `${formSubmitLink}` : submitForm.getAttribute('action'));
        }

        mainBody.style.paddingTop = '0';
        slideContainer.classList.add('abs');
        transOverlay.classList.add('transparent-overlay');
        slide.classList.add('show-sliding-form');

        // Activate mobile toggle menu button while viewing form on mobiles
        mobileMenuToggle(true);

        const hideForm = () => {
          mainBody.style.paddingTop = '5';
          slideContainer.classList.remove('abs');
          slide.classList.remove('show-sliding-form');
          transOverlay.classList.remove('transparent-overlay');
          mainBody.removeEventListener('click', hideForm, false);
          submitForm.setAttribute('action', '');
        };
        mainBody.addEventListener('click', hideForm, false);
      }

      const loginLinkRouter = () => {
        const anyUserTypeSignInBtn = document.querySelectorAll('button[class*="sign-in"]');

        // Adding Event listeners on all sign-in buttons on pages across the app
        // We presently have the following only on index.html and staffAndAdminMainPage.html
        anyUserTypeSignInBtn.forEach((signInType) => {
          signInType.addEventListener('click', function configLogInFormLink() {
            // the next line relies on each sign in button having a class attribute
            // whose first classname follows the signature like userType-
            let loginLink;
            if (this.classList.contains('root-sign-in')) {
              loginLink = 'admin_portal.html?rootAdmin';
            } else {
              loginLink = `${this.classList.value.split('-')[0]}_portal.html`;
            }
            console.log(loginLink);
            showForm(loginLink);
          });
        }, false);
      };

      const transactFormRouter = () => {
        const transactBtns = document.querySelectorAll('.transact');
        transactBtns.forEach((transactBtn) => {
          transactBtn.addEventListener('click', showForm, false);
        });
      };

      if (presentPageBody.classList.contains('loginPage')) {
        loginLinkRouter();
      } else {
        /* Sliding form on Page is for transaction */
        transactFormRouter();
      }
    };

    if (presentPageBody.classList.contains('slidingFormPage')) {
      slidingFormToggle();
    }

    const accItemToggle = () => {
      const accMenuItems = document.querySelectorAll('.accordion');
    
      function toggleAccItem() {
        this.classList.toggle('active-acc');
        const panel = this.nextElementSibling;
        panel.style.maxHeight = panel.style.maxHeight ? null : `${panel.scrollHeight}px`;
      }
      accMenuItems.forEach((accMenuItem) => {
        accMenuItem.addEventListener('click', toggleAccItem, false);
      });
    };

    if (presentPageBody.classList.contains('accordion-page')) {
      accItemToggle();
    }


    const confirmationBoxToggle = () => {
      const actionButtons = document.querySelectorAll('.action');
      const confirmationBox = document.querySelector('.confirmation');
      const confirmationBoxTxt = document.querySelector('.confirmation p');
      const confirmActionBtn = document.querySelector('.do-action');
      const stopActionBtn = document.querySelector('.stop-action');

      const transOverlay = document.querySelector('#transOverlay');

      function showDialogBox() {
        confirmationBoxTxt.textContent = `${this.dataset.question}`;
        confirmActionBtn.setAttribute('href', `${this.dataset.url}`);
        confirmActionBtn.textContent = `${this.dataset.urlTitle}`;
        confirmationBox.classList.add('show-confirmation');
        transOverlay.classList.add('transparent-overlay');

        const hideDialogBox = () => {
          confirmationBox.classList.remove('show-confirmation');
          transOverlay.classList.remove('transparent-overlay');
        };
        stopActionBtn.addEventListener('click', hideDialogBox, false);
        transOverlay.addEventListener('click', hideDialogBox, false);
      }

      actionButtons.forEach((actionButton) => {
        actionButton.addEventListener('click', showDialogBox, false);
      });
    };

    if (presentPageBody.classList.contains('confirmation-box')) {
      confirmationBoxToggle();
    }

    const adminCrewSignUpRouter = () => {
      const title = document.querySelector('title');
      const mainPageAside = document.querySelector('#pageSideBar');
      const portalPageAside = document.querySelector('#portalSideBar');
      const formIntro = document.querySelector('header.intro h3');
      const submitForm = document.querySelector('.sign-up-form form');
      const submitBtn = document.querySelector('#signupBtn');
      const logOut = document.querySelector('.log-out');

      const pageCaller = window.location.href.includes('staff') ? 'staff' :
                         window.location.href.includes('root') ? 'root' : 'admin';

      const updateSignUpForm = () => {
        switch (pageCaller) {
          case 'root':
            formIntro.textContent = "Create IT Admin Account that's needed to kickstart Leavaca";
            mainPageAside.style.display = 'block';
            submitBtn.textContent = 'Become the IT Admin';
            submitForm.setAttribute('action', 'root_admin_success.html');
            logOut.style.display = 'none';
            title.textContent = 'Banka | Root Admin Sign Up';
            break;
          // case 'employee'
          default:
            formIntro.textContent = 'Create Account for an Employee';
            portalPageAside.style.display = 'block';
            submitBtn.textContent = 'Create Employee Account';
            submitForm.setAttribute('action', 'admin_account_success.html?admin');
            logOut.style.display = 'block';
            title.textContent = 'Banka | Create Employee Account';
            accItemToggle();
            break;
        }
      };
      updateSignUpForm();
    };

    if (presentPageBody.classList.contains('admin-sign-up')) {
      adminCrewSignUpRouter();
    }

    const createAdminOrStaffSuccess = () => {
      const accountType = document.querySelector('#accountType');
      const signInBtnForAdminOrStaff = document.querySelector('#signInBtnForAdminOrStaff');
      if (window.location.href.includes('staff')) {
        accountType.textContent = accountType.dataset.staff;
        signInBtnForAdminOrStaff.textContent = `Staff${signInBtnForAdminOrStaff.textContent}`;
      } else {
        accountType.textContent = accountType.dataset.admin;
        signInBtnForAdminOrStaff.textContent = `Employee${signInBtnForAdminOrStaff.textContent}`;
      }
    };

    if (presentPageBody.classList.contains('admin-staff-success')) {
      createAdminOrStaffSuccess();
    }


    const configureForRootAdmin = () => {
      const configurePortalForRootAdmin = () => {
        // const welcomeHeading = document.querySelector('header.portal-intro.intro h3');
        // welcomeHeading.textContent += ' Root Admin';
        const regulateAdminSection = document
          .querySelector('section.regulate-admin-crew.hide-regulate-admin-crew');
        regulateAdminSection.classList.remove('hide-regulate-admin-crew');
      };
      if (presentPageBody.classList.contains('portal')) {
        configurePortalForRootAdmin();
      }
      const putRootAdminQueryOnLinks = () => {
        document.querySelectorAll('a').forEach((link) => {
          link.setAttribute('href', `${link.getAttribute('href')}?rootAdmin`);
        });
      };
      putRootAdminQueryOnLinks();
      if (presentPageBody.classList.contains('staff-access')) {
        document.querySelector('button[data-request="admin"]')
          .dataset.request += '?rootAdmin';
      }
    };

    const configureForAdmin = () => {
      const configurePortalForAdmin = () => {
        // const welcomeHeading = document.querySelector('header.portal-intro.intro h3');
        // welcomeHeading.textContent += ' Admin';
        const createStaffAcctSection = document
          .querySelector('section.account-creation.hide-staff-acct-creation');
        createStaffAcctSection.classList.remove('hide-staff-acct-creation');
      };
      if (presentPageBody.classList.contains('portal')) {
        configurePortalForAdmin();
      }
    };

    if (presentPageBody.classList.contains('root-admin-and-admin')) {
      if (window.location.href.includes('root') || window.sessionStorage.userType === 'rootAdmin') {
        configureForRootAdmin();
      } else {
        configureForAdmin();
      }
    }
  });
};

startApp();

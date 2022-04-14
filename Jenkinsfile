pipeline {
    agent any

    environment {
        NPM_REGISTRY_URL = "http://npm.test.pl.internal:8080/"
        NVM_DIR = "/var/lib/jenkins/.nvm"
        CHROME_BIN = 'google-chrome'
        PL_RELEASE_BRANCH = 'release'
        PL_MASTER_BRANCH = 'master'
        PL_DEV_BRANCH = 'dev'
        PL_RC_ENV = 'api-workplace-rc'
        PL_REPO = 'edu-clients'
        PL_RELEASE_CHANNEL = 'product-release'
        PL_JIRA_PROJECT_KEY = 'PL'
    }

    options {
        retry(1)
        timeout(time: 90, unit: 'MINUTES')
    }

    stages {
        stage('Setup') {
            steps {
                sh "env"
                script {
                    try {
                        sh 'which google-chrome'
                    } catch (Exception err) {
                        sh """
                        wget -q -O - https://dl-ssl.google.com/linux/linux_signing_key.pub | sudo apt-key add -
                        echo 'deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main' | sudo tee /etc/apt/sources.list.d/google-chrome.list
                        sudo apt-get update
                        sudo apt-get -y install google-chrome-stable
                        """
                    }
                }
                script {
                    // Install cypress depedencies
                    sh "sudo apt-get -y install xvfb libgtk2.0-0 libnotify-dev libgconf-2-4 libnss3 libxss1 libasound2"
                }
                sh """
                    echo "which npm: \$(which npm)"
                    echo "npm --version: \$(npm --version)"
                    echo "which node: \$(which node)"
                    echo "node --version: \$(node --version)"
                    export NVM_DIR=${NVM_DIR}
                    [ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"  # This loads nvm
                    nvm install v14.18.3 && nvm use v14.18.3
                    echo "which node: \$(which node)"
                    echo "node --version: \$(node --version)"
                    npm --registry ${NPM_REGISTRY_URL} install
                    npm run ci-setup
                    npm --registry ${NPM_REGISTRY_URL} run ci-build
                """
            }
        }
        stage('Setup Workflow') {
            when {
                expression { GIT_BRANCH == PL_MASTER_BRANCH || GIT_BRANCH == PL_RELEASE_BRANCH || GIT_BRANCH == PL_DEV_BRANCH }
            }
            steps {
                sh "env|sort"
                createVirtualEnv '${WORKSPACE}/.venv'
                executeIn '''
                    ${WORKSPACE}/.venv/bin/python -m pip install --upgrade pip
                '''
                dir('dev-workflow') {
                    checkout changelog: false, poll: false, scm: [$class: 'GitSCM', branches: [[name: '*/master']], doGenerateSubmoduleConfigurations: false, extensions: [], submoduleCfg: [], userRemoteConfigs: [[credentialsId: 'devopsuserpass', url: 'https://github.com/presencelearning/dev-workflow']]]
                }
                executeIn '${WORKSPACE}/.venv/bin/python -m pip install -r dev-workflow/requirements.txt'
            }
        }
        stage('Feature Freeze') {
            when {
                expression { GIT_BRANCH == PL_DEV_BRANCH }
            }
            steps {
                withCredentials([usernamePassword(credentialsId: 'devopsuserpass', usernameVariable: 'GITHUB_USERNAME', passwordVariable: 'GITHUB_PASSWORD'), usernamePassword(credentialsId: 'jira', usernameVariable: 'JIRA_USERNAME', passwordVariable: 'JIRA_PASSWORD'), usernamePassword(credentialsId: ' jenkins-slack-bot-token', usernameVariable: 'SLACK_BOT_USERNAME', passwordVariable: 'SLACK_API_TOKEN')]) {
                    // - Create Feature Freeze pull request from dev to release
                    // - Update Jira tickets fix version to "Dev"
                    executeIn '''python dev-workflow/r2d2.py release feature_freeze presencelearning/${PL_REPO} --jira-project-key ${PL_JIRA_PROJECT_KEY}'''
                }
            }
        }
        stage('Release Candidate') {
            when {
                expression { GIT_BRANCH == PL_RELEASE_BRANCH }
            }
            steps {
                withCredentials([usernamePassword(credentialsId: 'devopsuserpass', usernameVariable: 'GITHUB_USERNAME', passwordVariable: 'GITHUB_PASSWORD'), usernamePassword(credentialsId: 'jira', usernameVariable: 'JIRA_USERNAME', passwordVariable: 'JIRA_PASSWORD'), usernamePassword(credentialsId: ' jenkins-slack-bot-token', usernameVariable: 'SLACK_BOT_USERNAME', passwordVariable: 'SLACK_API_TOKEN')]) {
                    // - Create Release Candidate pull request from release to master
                    // - Update Jira tickets fix version
                    // - Notify via Slack
                    executeIn '''python dev-workflow/r2d2.py release release_candidate presencelearning/${PL_REPO} --jira-project-key ${PL_JIRA_PROJECT_KEY} --include-release-information true --slack-notification-channel=${PL_RELEASE_CHANNEL}'''
                }
            }
        }
        stage('Release') {
            when {
                expression { GIT_BRANCH == PL_MASTER_BRANCH }
            }
            steps {
                withCredentials([usernamePassword(credentialsId: 'devopsuserpass', usernameVariable: 'GITHUB_USERNAME', passwordVariable: 'GITHUB_PASSWORD'), usernamePassword(credentialsId: 'jira', usernameVariable: 'JIRA_USERNAME', passwordVariable: 'JIRA_PASSWORD'), usernamePassword(credentialsId: ' jenkins-slack-bot-token', usernameVariable: 'SLACK_BOT_USERNAME', passwordVariable: 'SLACK_API_TOKEN')]) {
                    // - Updates Jira tickets to "Done"
                    // - Updates Jira release to "Released"
                    executeIn '''python dev-workflow/r2d2.py release complete_release presencelearning/${PL_REPO} ${PL_JIRA_PROJECT_KEY}'''
                }
            }
        }
        /*
        stage('Test') {
            steps {
                // someday
            }
        }
        */
        stage('Release Candidate Deploy') {
            when {
                expression { BRANCH_NAME == PL_RELEASE_BRANCH }
            }
            steps {
                withCredentials([
                    usernamePassword(credentialsId: 'devopsuserpass', usernameVariable: 'GITHUB_USERNAME', passwordVariable: 'GITHUB_PASSWORD'),
                    usernamePassword(credentialsId: 'jira', usernameVariable: 'JIRA_USERNAME', passwordVariable: 'JIRA_PASSWORD'),
                    usernamePassword(credentialsId: ' jenkins-slack-bot-token', usernameVariable: 'SLACK_BOT_USERNAME', passwordVariable: 'SLACK_API_TOKEN'),
                    string(credentialsId: 'rundeck', variable: 'RUNDECK_API_TOKEN')
                ]) {
                    // Create pull request from release to dev
                    executeIn "python dev-workflow/r2d2.py github create_merge_pr presencelearning/${PL_REPO} --to-branch=${PL_DEV_BRANCH} --from-branch=${PL_RELEASE_BRANCH}"

                    // Deploy to the rc environment and notify channel.
                    executeIn "python dev-workflow/r2d2.py hal deploy ${PL_REPO} ${GIT_COMMIT} ${PL_RC_ENV} --slack-notification-channel=${PL_RELEASE_CHANNEL} --slack-notification-message='${PL_REPO.toUpperCase()} release branch updated. Updating k8s RC env (https://env29-apps.presencek8s.com/) to sha ${GIT_COMMIT}'"
                }
            }
        }
        stage('Release Deploy') {
            when {
                expression { GIT_BRANCH == PL_MASTER_BRANCH }
            }
            steps {
                withCredentials([
                    usernamePassword(credentialsId: 'devopsuserpass', usernameVariable: 'GITHUB_USERNAME', passwordVariable: 'GITHUB_PASSWORD'),
                    usernamePassword(credentialsId: 'jira', usernameVariable: 'JIRA_USERNAME', passwordVariable: 'JIRA_PASSWORD'),
                    usernamePassword(credentialsId: ' jenkins-slack-bot-token', usernameVariable: 'SLACK_BOT_USERNAME', passwordVariable: 'SLACK_API_TOKEN'),
                    string(credentialsId: 'rundeck', variable: 'RUNDECK_API_TOKEN')
                ]) {
                    // Create pull request from master to release
                    executeIn "python dev-workflow/r2d2.py github create_merge_pr presencelearning/${PL_REPO} --to-branch=${PL_RELEASE_BRANCH} --from-branch=${PL_MASTER_BRANCH}"

                    // Deploy to the "active" environment
                    executeIn "python dev-workflow/r2d2.py hal deploy ${PL_REPO} ${GIT_COMMIT} stag --slack-notification-channel=${PL_RELEASE_CHANNEL} --slack-notification-message='${PL_REPO.toUpperCase()} master branch updated. Updating stag and k8s ACTIVE env (https://env30-apps.presencek8s.com/) to sha ${GIT_COMMIT}'"
                }
            }
        }
    }
    post {
        always {
            deleteDir()
        }
    }
}


def createVirtualEnv(String name) {
    sh 'virtualenv -p /usr/bin/python3.6 ' + name
}

def executeIn(String script) {
    sh '. .venv/bin/activate && ' + script
}

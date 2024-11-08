import { Routes } from '@angular/router';
import { PassengerComponent } from './passenger/passenger.component';
import { AgentComponent } from './agent/agent.component';
import { AppComponent } from './app.component';
import { AssistantScreenComponent } from './assistant-screen/assistant-screen.component';
import { PassengerScreenComponent } from './passenger-screen/passenger-screen.component';

export const routes: Routes = [
    {
        path: '',
        component: AppComponent,
    },
    {
        path: 'passenger-ui',
        component: PassengerComponent,
    },
    {
        path: 'agent-ui',
        component: AgentComponent,
    },
    {
        path: 'passenger-screen',
        component: PassengerScreenComponent,
    },
    {
        path: 'assistant-screen',
        component: AssistantScreenComponent,
    }
];

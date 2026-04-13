@extends('layouts.app')

@section('title', 'Clients · TaskFlow')
@section('eyebrow', 'Administration')
@section('page-title', 'Clients')

@section('content')

    <div class="page-header">
        <h1>Client Management</h1>
        <p>Manage client profiles, contacts, and project assignments.</p>
    </div>

    <div class="grid-2">

        {{-- Create client --}}
        <div class="card">
            <div class="section-header">
                <div>
                    <div class="section-title">Add New Client</div>
                    <div class="section-subtitle">Create a client profile to link with projects</div>
                </div>
            </div>
            <form class="form-grid" action="{{ route('clients.store') }}" method="POST">
                @csrf
                <div class="form-row">
                    <label>
                        <span class="label-text">Company Name</span>
                        <input type="text" name="name" placeholder="e.g. Acme Corp" required>
                    </label>
                    <label>
                        <span class="label-text">Industry</span>
                        <input type="text" name="industry" placeholder="e.g. Technology">
                    </label>
                </div>
                <div class="form-row">
                    <label>
                        <span class="label-text">Contact Person</span>
                        <input type="text" name="contact_name" placeholder="Full name" required>
                    </label>
                    <label>
                        <span class="label-text">Contact Email</span>
                        <input type="email" name="contact_email" placeholder="contact@client.com">
                    </label>
                </div>
                <div class="form-row">
                    <label>
                        <span class="label-text">Contact Phone</span>
                        <input type="text" name="contact_phone" placeholder="+84...">
                    </label>
                    <label>
                        <span class="label-text">Company Size</span>
                        <input type="text" name="company_size" placeholder="e.g. 50–200">
                    </label>
                </div>
                <label>
                    <span class="label-text">Account Manager</span>
                    <select name="owner_user_id">
                        <option value="">— Unassigned —</option>
                        @foreach ($owners as $owner)
                            <option value="{{ $owner->id }}">{{ $owner->name }}</option>
                        @endforeach
                    </select>
                </label>
                <label>
                    <span class="label-text">Internal Notes</span>
                    <textarea name="notes" rows="3" placeholder="Background, special requirements, etc."></textarea>
                </label>
                <button class="btn btn-primary">
                    <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M8 3v10M3 8h10"/>
                    </svg>
                    Add Client
                </button>
            </form>
        </div>

        {{-- Assign project + client list --}}
        <div class="stack">
            <div class="card">
                <div class="section-header">
                    <div>
                        <div class="section-title">Assign Project to Client</div>
                        <div class="section-subtitle">Link an existing project to a client account</div>
                    </div>
                </div>
                <form class="form-grid" action="{{ route('clients.assign-project') }}" method="POST">
                    @csrf
                    <label>
                        <span class="label-text">Project</span>
                        <select name="project_id" required>
                            @foreach ($projects as $project)
                                <option value="{{ $project->id }}">{{ $project->name }}</option>
                            @endforeach
                        </select>
                    </label>
                    <label>
                        <span class="label-text">Client</span>
                        <select name="client_id" required>
                            @foreach ($clients as $client)
                                <option value="{{ $client->id }}">{{ $client->name }}</option>
                            @endforeach
                        </select>
                    </label>
                    <button class="btn btn-secondary">Assign</button>
                </form>
            </div>

            <div class="card">
                <div class="section-header">
                    <div>
                        <div class="section-title">All Clients</div>
                        <div class="section-subtitle">{{ $clients->count() }} client{{ $clients->count() !== 1 ? 's' : '' }} in workspace</div>
                    </div>
                </div>
                <div class="list-stack">
                    @forelse ($clients as $client)
                        <div class="list-row" style="cursor:default;">
                            <div class="row-main">
                                <strong>{{ $client->name }}</strong>
                                <small>{{ $client->contact_name }}{{ $client->industry ? ' · '.$client->industry : '' }}</small>
                            </div>
                            <div style="text-align:right;">
                                <span class="badge badge-default">{{ $client->projects->count() }} project{{ $client->projects->count() !== 1 ? 's' : '' }}</span>
                            </div>
                        </div>
                    @empty
                        <div class="empty-state">No clients added yet.</div>
                    @endforelse
                </div>
            </div>
        </div>
    </div>

@endsection

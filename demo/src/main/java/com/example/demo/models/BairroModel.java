package com.example.demo.models;

import java.io.Serializable;


import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "bairros")
@Getter
@Setter
public class BairroModel implements Serializable{
    private static final long serialVersionUID = 1L;

    @Id
    @GeneratedValue(strategy = jakarta.persistence.GenerationType.IDENTITY)
    private Integer id;

    private String nome;

    private String cidade;

    private String estado;

    private String cepInicial;

    private String cepFinal;

    public BairroModel(){};

    public BairroModel(Integer id, String nome, String cidade, String estado, String cepInicial, String cepFinal){
        super();
        this.id =id;
        this.nome=nome;
        this.cidade=cidade;
        this.estado=estado;
        this.cepInicial=cepInicial;
        this.cepFinal=cepFinal;
    }

    @Override
    public int hashCode() {
        final int prime = 31;
        int result = 1;
        result = prime * result + ((id == null) ? 0 : id.hashCode());
        result = prime * result + ((nome == null) ? 0 : nome.hashCode());
        return result;
    }

    @Override
    public boolean equals(Object obj) {
        if (this == obj)
            return true;
        if (obj == null)
            return false;
        if (getClass() != obj.getClass())
            return false;
        BairroModel other = (BairroModel) obj;
        if (id == null) {
            if (other.id != null)
                return false;
        } else if (!id.equals(other.id))
            return false;
        if (nome == null) {
            if (other.nome != null)
                return false;
        } else if (!nome.equals(other.nome))
            return false;
        return true;
    }

    


  
}
